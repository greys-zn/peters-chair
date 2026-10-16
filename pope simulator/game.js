    (() => {
      const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const INITIAL = {
        year: 2031, month: 2, actions: 3, faithful: 1320, connections: 54, treasury: 68, trust: 62,
        factions: { Modernists: 55, Traditionalists: 57, Curia: 61, Youth: 49, 'Local clergy': 60 },
        orders: { Dominicans: 58, Jesuits: 65, Franciscans: 62, Benedictines: 54, Salesians: 48 },
        countries: {
          'United States': {faithful:69.2, relations:58,bishop:'Card. Hayes',context:'A vibrant, divided Church navigates a noisy public square.'},
          Brazil:{faithful:123.4,relations:63,bishop:'Card. Oliveira',context:'A vast missionary Church asks for care beyond the great cities.'},
          Argentina:{faithful:36.7,relations:70,bishop:'Card. Alvarez',context:'A deeply rooted Catholic tradition faces economic strain.'},
          'United Kingdom':{faithful:5.2,relations:49,bishop:'Card. Osei',context:'A small but outward-looking Catholic community seeks a public voice.'},
          France:{faithful:29.8,relations:54,bishop:'Card. Moreau',context:'An old Catholic inheritance meets an increasingly secular age.'},
          Italy:{faithful:47.6,relations:68,bishop:'Card. Conti',context:'The heart of the Church; reform-minded clergy seek a steadier hand.'},
          Poland:{faithful:33.2,relations:72,bishop:'Card. Kowalski',context:'A close-knit Church asks how tradition can speak to a new generation.'},
          Nigeria:{faithful:34.7,relations:66,bishop:'Card. Okafor',context:'One of the fastest-growing Catholic communities, alive with vocations.'},
          'Democratic Republic of the Congo':{faithful:52.4,relations:59,bishop:'Card. Ilunga',context:'A young, growing Church bears the cost of conflict and displacement.'},
          India:{faithful:22.1,relations:53,bishop:'Card. Thomas',context:'Ancient Christian communities build friendship among many faiths.'},
          Philippines:{faithful:85.4,relations:74,bishop:'Card. Santos',context:'A warm-hearted Catholic nation looks to Rome in a moment of change.'},
          Japan:{faithful:0.5,relations:46,bishop:'Card. Nakamura',context:'A small, resilient community serves quietly in a secular society.'},
          Mexico:{faithful:98.3,relations:67,bishop:'Card. Herrera',context:'Popular devotion is strong; rural communities call for more shepherds.'},
          Lebanon:{faithful:1.8,relations:57,bishop:'Card. Haddad',context:'Eastern Catholic communities face an uncertain future in their homeland.'}
        },
        visited:[], yearStartFaithful:1320, yearStartConnections:54, log:[], eventCount:0, totalActions:0,
        papalName:'Leo', archetype:'diplomat', lifestyle:'diplomacy', lifestyleXp:0, lifestylePoints:0, unlockedPerks:[],
        origin:'Italy', chosenOrder:'Jesuits', started:false, abilityUsedYear:0, lifestyleActionUsedYear:0,
        churchRelations:{Lutheran:44,Reformed:38,Evangelical:34,Muslim:42}, selectedChurch:'Lutheran',
        regionalEvents:{Australia:false,China:false},
        clergy:[
          {id:'moretti',name:'Cardinal Lucia Moretti',trait:'Diplomatic',faction:'Curia',skills:{diplomacy:16,stewardship:8,theology:10},opinion:62,loyalty:68},
          {id:'okoye',name:'Cardinal Samuel Okoye',trait:'Pastoral',faction:'Local clergy',skills:{diplomacy:8,stewardship:16,theology:11},opinion:72,loyalty:76},
          {id:'zielinski',name:'Archbishop Tomasz Zielinski',trait:'Theologian',faction:'Traditionalists',skills:{diplomacy:7,stewardship:9,theology:17},opinion:56,loyalty:61},
          {id:'costa',name:'Bishop Rafael Costa',trait:'Administrator',faction:'Curia',skills:{diplomacy:10,stewardship:18,theology:8},opinion:65,loyalty:72}
        ],
        appointments:{secretary:null,almoner:null,doctrine:null,steward:null},courtChoices:{}
      };
      INITIAL.countries.Australia={faithful:5.5,relations:62,bishop:'Card. Nguyen',context:'A far-flung Catholic community balances city parishes, remote missions, and a changing climate.'};
      INITIAL.countries.China={faithful:12.0,relations:44,bishop:'Card. Zhang',context:'Catholic communities navigate a delicate relationship between local pastoral life and the state.'};
      const initializeCountryManagement = countries => {
        Object.values(countries).forEach(country=>{
          country.ecumenicalWork=country.ecumenicalWork||{};
          country.development=Number.isFinite(country.development)?country.development:cap(Math.round(20+country.faithful/12),20,45);
          country.prosperity=Number.isFinite(country.prosperity)?country.prosperity:cap(Math.round(35+country.relations/2),45,80);
          country.localOpinion=Number.isFinite(country.localOpinion)?country.localOpinion:cap(country.relations,0,100);
          country.incomeBonus=Number.isFinite(country.incomeBonus)?country.incomeBonus:0;
          country.faithfulGrowth=Number.isFinite(country.faithfulGrowth)?country.faithfulGrowth:0;
        });
      };
      const ACTIONS = [
        {id:'visit',glyph:'✦',name:'Apostolic visit',desc:'Travel to the selected country',treasuryCost:8,cost:'1 action · −8m',type:'country'},
        {id:'bishop',glyph:'♙',name:'Appoint a bishop',desc:'Name a shepherd for the local church',treasuryCost:5,cost:'1 action · −5m',type:'country'},
        {id:'mission',glyph:'⌂',name:'Fund a mission',desc:'Support schools, clinics & outreach',treasuryCost:10,cost:'1 action · −10m',type:'country'},
        {id:'dialogue',glyph:'↔',name:'Open a dialogue',desc:'Build bridges with local leaders',treasuryCost:4,cost:'1 action · −4m',type:'country'},
        {id:'encyclical',glyph:'✉',name:'Issue an encyclical',desc:'Set a direction for the universal Church',treasuryCost:2,cost:'1 action · −2m',type:'global'},
        {id:'orders',glyph:'✣',name:'Consult the orders',desc:'Invite an order to lead a new work',treasuryCost:6,cost:'1 action · −6m',type:'global'}
      ];
      const COURT_OFFICES = {
        secretary:{name:'Secretary of State',skill:'diplomacy',yield:'connections'},
        almoner:{name:'Papal Almoner',skill:'stewardship',yield:'faithful'},
        doctrine:{name:'Prefect for Doctrine',skill:'theology',yield:'trust'},
        steward:{name:'Prefect for the Economy',skill:'stewardship',yield:'treasury'}
      };
      const ARCHETYPES = {
        diplomat:{name:'The Diplomat',passiveText:'Dialogue earns +2 extra diplomatic ties.',passiveAction:'dialogue',passive:{connections:2},ability:{name:'Holy See peace mission',desc:'Open a high-level channel for peace',treasuryCost:7,effect:{connections:8,trust:2,factions:{Curia:2,'Local clergy':2}}}},
        pilgrim:{name:'The Pilgrim',passiveText:'Apostolic visits gain +2m faithful.',passiveAction:'visit',passive:{faithful:2},ability:{name:'World youth encounter',desc:'Gather a new generation in service',treasuryCost:10,effect:{faithful:8,trust:2,factions:{Youth:7,Salesians:3}}}},
        reformer:{name:'The Reformer',passiveText:'Encyclicals gain standing with reformers and traditionalists.',passiveAction:'encyclical',passive:{factions:{Modernists:2,Traditionalists:2}},ability:{name:'Convene a council',desc:'Bring the Church together in discernment',treasuryCost:12,effect:{trust:2,factions:{Modernists:6,Traditionalists:6,Curia:-2,'Local clergy':2}}}},
        steward:{name:'The Steward',passiveText:'Order consultations grant +2 extra influence.',passiveAction:'orders',passive:{},ability:{name:'Reform the Curia',desc:'Renew the Roman administration',treasuryCost:8,effect:{trust:3,connections:2,factions:{Curia:8,'Local clergy':3}}}}
      };
      const LIFESTYLES = {
        diplomacy:{name:'Diplomacy',description:'Build trust abroad and find common ground between faiths.',xpActions:['dialogue','conversation','joint-mission','interfaith-mediation']},
        pilgrimage:{name:'Pilgrimage',description:'Be present in local churches and strengthen pastoral missions.',xpActions:['visit','mission','joint-mission']},
        theology:{name:'Theology',description:'Guide public debate, deepen teaching, and convene the Church.',xpActions:['encyclical','public-debate','lifestyle-council']},
        stewardship:{name:'Stewardship',description:'Care for diocesan lands, budgets, and the people who serve them.',xpActions:['invest','relief','tithe','appoint','audience','dismiss']}
      };
      const LIFESTYLE_PERKS = {
        diplomacy:[
          {id:'interfaith-envoys',name:'Interfaith envoys',description:'Unlock conversations with local Muslim communities.'},
          {id:'shared-relief',name:'Common cause',requires:'interfaith-envoys',description:'Unlock joint Muslim-Catholic relief missions.'},
          {id:'peace-broker',name:'Peace broker',requires:'shared-relief',description:'Unlock local interfaith mediation.'}
        ],
        pilgrimage:[
          {id:'pilgrim-roads',name:'Pilgrim roads',description:'Apostolic visits gain +2m faithful.'},
          {id:'field-chaplaincies',name:'Field chaplaincies',requires:'pilgrim-roads',description:'Missions gain +3m faithful.'},
          {id:'great-pilgrimage',name:'A world of small churches',requires:'field-chaplaincies',description:'First visits to a country earn +2 trust.'}
        ],
        theology:[
          {id:'synodal-listening',name:'Synodal listening',description:'Public debates cost less diplomatic goodwill and build trust.'},
          {id:'encyclical-scholarship',name:'Living tradition',requires:'synodal-listening',description:'Encyclicals earn +2 trust and +2 modernist standing.'},
          {id:'council-of-voices',name:'Council of voices',requires:'encyclical-scholarship',description:'Unlock a once-yearly universal synod.'}
        ],
        stewardship:[
          {id:'land-survey',name:'Land survey',description:'Diocesan development costs 3m less and adds +2 development.'},
          {id:'relief-networks',name:'Parish relief networks',requires:'land-survey',description:'Tax relief costs 2m less and builds more local opinion.'},
          {id:'balanced-ledgers',name:'Balanced ledgers',requires:'relief-networks',description:'The Apostolic treasury earns +2m every month.'}
        ]
      };
      const ORDER_PERKS = {
        Dominicans:{action:'encyclical',effect:{trust:1,factions:{Traditionalists:1}},text:'Preaching & study: encyclicals earn +1 trust and +1 traditionalist standing.'},
        Jesuits:{action:'dialogue',effect:{connections:2},text:'Global networks: dialogues earn +2 extra diplomatic ties.'},
        Franciscans:{action:'mission',effect:{faithful:3},text:'Service to the poor: missions welcome +3m extra faithful.'},
        Benedictines:{monthlyIncome:1,text:'Stewardship: the Apostolic treasury gains +1m each month.'},
        Salesians:{action:'visit',effect:{faithful:1,factions:{Youth:2}},text:'Youth ministry: visits gain +1m faithful and +2 youth standing.'}
      };
      const CHURCHES = [
        {id:'Lutheran',name:'Lutheran Churches'},
        {id:'Reformed',name:'Reformed / Calvinist Churches'},
        {id:'Evangelical',name:'Evangelical Churches'}
      ];
      const RELIGIOUS_COMMUNITIES=[...CHURCHES,{id:'Muslim',name:'Local Muslim communities'}];
      const LOCAL_CHURCH_PRESENCE = {
        'United States':{Lutheran:48,Reformed:36,Evangelical:82},Brazil:{Lutheran:8,Reformed:5,Evangelical:76},Argentina:{Lutheran:12,Reformed:14,Evangelical:48},'United Kingdom':{Lutheran:62,Reformed:55,Evangelical:68},France:{Lutheran:8,Reformed:38,Evangelical:12},Italy:{Lutheran:4,Reformed:13,Evangelical:9},Poland:{Lutheran:14,Reformed:8,Evangelical:6},Nigeria:{Lutheran:5,Reformed:4,Evangelical:84},'Democratic Republic of the Congo':{Lutheran:8,Reformed:5,Evangelical:50},India:{Lutheran:16,Reformed:8,Evangelical:20},Philippines:{Lutheran:3,Reformed:3,Evangelical:23},Japan:{Lutheran:5,Reformed:4,Evangelical:8},Mexico:{Lutheran:3,Reformed:8,Evangelical:24},Lebanon:{Lutheran:6,Reformed:5,Evangelical:7}
      };
      LOCAL_CHURCH_PRESENCE.Australia={Lutheran:7,Reformed:13,Evangelical:29};
      LOCAL_CHURCH_PRESENCE.China={Lutheran:2,Reformed:1,Evangelical:3};
      LOCAL_CHURCH_PRESENCE.Australia.Muslim=18;
      LOCAL_CHURCH_PRESENCE.China.Muslim=13;
      LOCAL_CHURCH_PRESENCE['United States'].Muslim=21;
      LOCAL_CHURCH_PRESENCE.Brazil.Muslim=5;
      LOCAL_CHURCH_PRESENCE['United Kingdom'].Muslim=22;
      LOCAL_CHURCH_PRESENCE.France.Muslim=29;
      LOCAL_CHURCH_PRESENCE.Italy.Muslim=14;
      LOCAL_CHURCH_PRESENCE.Nigeria.Muslim=22;
      LOCAL_CHURCH_PRESENCE.India.Muslim=31;
      LOCAL_CHURCH_PRESENCE.Philippines.Muslim=16;
      LOCAL_CHURCH_PRESENCE.Mexico.Muslim=4;
      LOCAL_CHURCH_PRESENCE.Lebanon.Muslim=38;
      const ORIGIN_BONUSES = {
        'United States':{action:'dialogue',effect:{connections:2},text:'Home dialogues build +2 extra diplomatic ties.'},
        Brazil:{action:'mission',effect:{faithful:3},text:'Home missions welcome +3m extra faithful.'},
        Argentina:{action:'visit',effect:{trust:2},text:'Home visits earn +2 extra public trust.'},
        'United Kingdom':{action:'dialogue',effect:{connections:3},text:'Home dialogues build +3 extra diplomatic ties.'},
        France:{action:'encyclical',effect:{factions:{Modernists:2},trust:1},text:'Encyclicals earn +2 reformist standing and +1 trust.'},
        Italy:{action:'bishop',effect:{factions:{Curia:2},connections:1},text:'Home appointments earn +2 Curia standing and +1 tie.'},
        Poland:{action:'bishop',effect:{factions:{Traditionalists:2},trust:1},text:'Home appointments earn +2 traditionalist standing and +1 trust.'},
        Nigeria:{action:'mission',effect:{faithful:4},text:'Home missions welcome +4m extra faithful.'},
        'Democratic Republic of the Congo':{action:'mission',effect:{relations:4,factions:{'Local clergy':2}},text:'Home missions strengthen relations and local clergy.'},
        India:{action:'dialogue',effect:{connections:1,relations:3},text:'Home dialogue deepens local ties and relations.'},
        Philippines:{action:'visit',effect:{faithful:4},text:'Home visits welcome +4m extra faithful.'},
        Japan:{action:'dialogue',effect:{connections:3},text:'Home dialogues build +3 extra diplomatic ties.'},
        Mexico:{action:'visit',effect:{faithful:3,trust:1},text:'Home visits grow the faithful and earn trust.'},
        Lebanon:{action:'dialogue',effect:{connections:2,relations:2},text:'Home dialogue strengthens diplomacy and relations.'}
      };
      ORIGIN_BONUSES.Australia={action:'mission',effect:{faithful:3,trust:1},text:'Home missions support remote communities and earn trust.'};
      ORIGIN_BONUSES.China={action:'dialogue',effect:{connections:2,relations:3},text:'Home dialogue strengthens diplomatic ties and local relations.'};
      const MAP_POINTS = {
        'United States':[174,126],Brazil:[226,278],Argentina:[217,342],'United Kingdom':[397,125],France:[418,144],Italy:[444,163],Poland:[455,133],Nigeria:[419,250],'Democratic Republic of the Congo':[435,282],India:[537,226],Philippines:[616,232],Japan:[660,173],Mexico:[184,196],Lebanon:[473,181]
      };
      MAP_POINTS.Australia=[718,286];
      MAP_POINTS.China=[583,150];
      const EVENTS = [
        {kicker:'A letter from the faithful',title:'A church with locked doors',copy:'A winter storm has damaged a shelter serving displaced families in Lebanon. The local archbishop pleads for help. The Curia cautions that the treasury is already stretched.',choices:[
          {label:'Send emergency aid from the treasury',outcome:'−12m · +3 trust · +2 ties',effect:{treasury:-12,trust:3,connections:2,factions:{'Local clergy':3,Youth:1}}},
          {label:'Ask Catholic relief orders to lead',outcome:'+3 ties · +4 order influence',effect:{connections:3,trust:2,orders:{Franciscans:4},factions:{'Local clergy':2,Curia:-1}}},
          {label:'Appeal to international partners',outcome:'+4 ties · +2 trust',effect:{connections:4,trust:2,factions:{Modernists:1,Curia:1}}}
        ]},
        {kicker:'A matter of doctrine',title:'The synod asks to be heard',copy:'A diverse synod in Germany has asked for a careful study of how the Church accompanies divorced and remarried Catholics. Traditionalist voices warn against haste; younger Catholics are watching closely.',choices:[
          {label:'Commission a broad theological study',outcome:'+6 modernists · +3 trust',effect:{factions:{Modernists:6,Traditionalists:-2,Curia:2,Youth:4},trust:3}},
          {label:'Reaffirm existing teaching, invite pastoral care',outcome:'+6 traditionalists · +2 clergy',effect:{factions:{Traditionalists:6,Modernists:-2,'Local clergy':2},trust:2}},
          {label:'Let local bishops discern pastoral practice',outcome:'+5 clergy · +3 modernists',effect:{factions:{'Local clergy':5,Modernists:3,Curia:-2},connections:1}}
        ]},
        {kicker:'A sudden opportunity',title:'A door opens in Beijing',copy:'A discreet invitation arrives from Chinese officials. A careful exchange could make life easier for Catholics there, but would require a difficult conversation about the appointment of bishops.',choices:[
          {label:'Accept a formal round of talks',outcome:'+9 ties · Curia divided',effect:{connections:9,trust:-2,factions:{Curia:-3,Modernists:2,Traditionalists:-2}}},
          {label:'Send a quiet diplomatic envoy',outcome:'+5 ties · +3 Curia',effect:{connections:5,factions:{Curia:3,'Local clergy':1}}},
          {label:'Wait for stronger guarantees',outcome:'+3 trust · −2 ties',effect:{trust:3,connections:-2,factions:{Traditionalists:2,Curia:1}}}
        ]},
        {kicker:'Voices from the square',title:'The young are leaving',copy:'A candid open letter from young Catholics in France describes feeling unwelcome in their own parishes. It is spreading quickly. Your answer will be read well beyond France.',choices:[
          {label:'Invite young Catholics to a listening assembly',outcome:'+7 youth · +3 trust',effect:{factions:{Youth:7,Modernists:2,Curia:-1},trust:3,faithful:8}},
          {label:'Launch a global youth service year',outcome:'−8m · +6 youth · +4m faithful',effect:{treasury:-8,factions:{Youth:6,Salesians:4},faithful:4,trust:2}},
          {label:'Ask local bishops to respond directly',outcome:'+4 clergy · +2 ties',effect:{factions:{'Local clergy':4,Youth:1},connections:2}}
        ]},
        {kicker:'An urgent dispatch',title:'The bells of Kinshasa',copy:'Rising violence has displaced families around Kinshasa. The Jesuits and local clergy have appealed for safe passage and a public appeal for peace.',choices:[
          {label:'Make a public appeal and fund relief',outcome:'−10m · +5 trust · +4m faithful',effect:{treasury:-10,trust:5,faithful:4,factions:{'Local clergy':4,Jesuits:3}}},
          {label:'Send a diplomatic delegation',outcome:'+5 ties · +2 Curia',effect:{connections:5,factions:{Curia:2,'Local clergy':2}}},
          {label:'Call the warring parties to the Vatican',outcome:'+4 trust · +3 ties',effect:{trust:4,connections:3,factions:{Traditionalists:1,Modernists:1}}}
        ]},
        {kicker:'A decision for the Church',title:'Who will teach the next generation?',copy:'The Jesuit universities propose a new international institute for ethics and emerging technology. Some in the Curia worry that the plan reaches beyond the Church’s means.',choices:[
          {label:'Endow the institute',outcome:'−14m · +7 Jesuits · +3 trust',effect:{treasury:-14,trust:3,orders:{Jesuits:7},factions:{Modernists:3,Youth:2}}},
          {label:'Invite the Dominicans to co-lead',outcome:'−8m · +4 Dominicans · +3 ties',effect:{treasury:-8,connections:3,orders:{Dominicans:4,Jesuits:2},factions:{Curia:2,Modernists:2}}},
          {label:'Ask for a smaller, locally funded pilot',outcome:'+3 Curia · +2 ties',effect:{connections:2,factions:{Curia:3,Traditionalists:1,Youth:-1}}}
        ]}
      ];
      const $ = s => document.querySelector(s);
      let state;
      let selectedCountry = 'Italy';
      let eventTimer = null;
      let toastTimer = null;
      const clone = value => JSON.parse(JSON.stringify(value));
      const cap = (value,min,max) => Math.max(min,Math.min(max,value));
      initializeCountryManagement(INITIAL.countries);
      const escapeHTML = value => String(value).replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
      const currentCountry = () => state.countries[selectedCountry];
      const selectedArchetype = () => document.querySelector('input[name="archetype"]:checked')?.value || state.archetype;
      const hasLifestylePerk = perkId => state.unlockedPerks.includes(perkId);
      const gainLifestyleXp = activity => {
        if(!LIFESTYLES[state.lifestyle].xpActions.includes(activity)) return;
        state.lifestyleXp++;
        if(state.lifestyleXp>=3) {
          state.lifestyleXp-=3; state.lifestylePoints++;
          toast('A lifestyle perk point is ready to spend.');
        }
      };
      const unlockLifestylePerk = perkId => {
        const perks=LIFESTYLE_PERKS[state.lifestyle]||[];
        const perk=perks.find(item=>item.id===perkId);
        if(!perk||hasLifestylePerk(perkId)||state.lifestylePoints<1||(perk.requires&&!hasLifestylePerk(perk.requires))) return;
        state.lifestylePoints--; state.unlockedPerks.push(perkId);
        note(`Pope ${state.papalName} developed the ${perk.name.toLowerCase()} lifestyle perk.`);
        toast(`${perk.name} unlocked.`);
        render();
      };
      const renderLifestylePanel = () => {
        const lifestyle=LIFESTYLES[state.lifestyle]; const perks=LIFESTYLE_PERKS[state.lifestyle];
        $('#lifestyle-title').textContent=lifestyle.name;
        $('#lifestyle-points').textContent=`${state.lifestylePoints} perk point${state.lifestylePoints===1?'':'s'}`;
        $('#lifestyle-progress').innerHTML=`<div>${lifestyle.description}<br>${state.lifestyleXp}/3 matching actions toward your next perk point</div><div class="lifestyle-progress-track"><div class="lifestyle-progress-fill" style="width:${state.lifestyleXp/3*100}%"></div></div>`;
        $('#perk-tree').innerHTML=perks.map((perk,index)=>{
          const unlocked=hasLifestylePerk(perk.id);
          const waiting=perk.requires&&!hasLifestylePerk(perk.requires);
          const available=!unlocked&&!waiting&&state.lifestylePoints>0;
          return `<article class="perk-node ${unlocked?'unlocked':''} ${!unlocked&&!available?'locked':''}"><div class="perk-node-head"><span class="perk-node-name">${perk.name}</span><span class="perk-node-tier">TIER ${index+1}</span></div><div class="perk-node-effect">${perk.description}</div><div class="perk-node-footer"><span class="perk-node-status">${unlocked?'UNLOCKED':waiting?'Requires previous perk':state.lifestylePoints?'Ready to unlock':'Earn a perk point'}</span><button class="perk-unlock" type="button" data-perk-unlock="${perk.id}" ${available?'':'disabled'}>${unlocked?'Learned':'Unlock'}</button></div></article>`;
        }).join('');
      };
      const ensureOrderPicker = () => {
        if($('#chosen-order')) return;
        const label=document.createElement('label');
        label.className='setup-label setup-order-field';
        label.htmlFor='chosen-order';
        label.append('Preferred religious order');
        const select=document.createElement('select');
        select.className='setup-input';
        select.id='chosen-order';
        select.name='chosen-order';
        for(const name of Object.keys(ORDER_PERKS)) {
          const option=document.createElement('option'); option.value=name; option.textContent=name; select.append(option);
        }
        label.append(select); $('.setup-fields').append(label);
        select.addEventListener('change',updateSetupPreview);
      };
      const ensureLifestylePicker = () => {
        if($('#chosen-lifestyle')) return;
        const label=document.createElement('label'); label.className='setup-label setup-order-field'; label.htmlFor='chosen-lifestyle'; label.append('Starting lifestyle');
        const select=document.createElement('select'); select.className='setup-input'; select.id='chosen-lifestyle'; select.name='chosen-lifestyle';
        for(const [id,lifestyle] of Object.entries(LIFESTYLES)) { const option=document.createElement('option'); option.value=id; option.textContent=lifestyle.name; select.append(option); }
        label.append(select); $('.setup-fields').append(label); select.addEventListener('change',updateSetupPreview);
      };
      const localChurchInfluence = (countryName,churchId) => {
        const presence=LOCAL_CHURCH_PRESENCE[countryName]?.[churchId]||0;
        const relationship=state.churchRelations[churchId]||0;
        const work=state.countries[countryName].ecumenicalWork?.[churchId]||0;
        return cap(Math.round(presence*relationship/100+work),0,100);
      };
      const placeInfluence = countryName => Math.round(RELIGIOUS_COMMUNITIES.reduce((total,church)=>total+localChurchInfluence(countryName,church.id),0)/RELIGIOUS_COMMUNITIES.length);
      const localActionBonus = countryName => Math.floor(placeInfluence(countryName)/25);
      const setSideTab = tab => {
        for(const name of ['audience','churches','court','lifestyle']) {
          const selected=name===tab;
          $(`#${name}-tab`).setAttribute('aria-selected',String(selected));
          $(`#${name}-panel`).hidden=!selected;
        }
      };
      const renderChurchPanel = () => {
        const country=currentCountry();
        const church=RELIGIOUS_COMMUNITIES.find(item=>item.id===state.selectedChurch)||RELIGIOUS_COMMUNITIES[0];
        const relationship=state.churchRelations[church.id];
        const presence=LOCAL_CHURCH_PRESENCE[selectedCountry]?.[church.id]||0;
        const influence=localChurchInfluence(selectedCountry,church.id);
        const standing=relationship>=65?'Close relations':relationship>=45?'Working relations':relationship>=25?'Cautious':'Strained';
        $('#church-country-label').textContent=selectedCountry;
        $('#church-list').innerHTML=RELIGIOUS_COMMUNITIES.map(item=>`<button class="church-choice" type="button" data-church="${item.id}" aria-pressed="${item.id===church.id}"><span class="church-choice-name">${item.name.replace(' Churches','')}</span><span class="church-choice-relation">RELATION ${state.churchRelations[item.id]}</span></button>`).join('');
        $('#church-detail').innerHTML=`<div class="church-detail-top"><span class="church-detail-name">${church.name}</span><span class="church-standing">${standing} · ${relationship}/100</span></div><div class="church-metrics"><div class="church-metric"><span class="church-metric-label">Local presence · ${selectedCountry}</span><span class="church-metric-value">${presence}/100</span><div class="church-presence-track"><div class="church-presence-fill" style="width:${presence}%"></div></div></div><div class="church-metric"><span class="church-metric-label">Papal influence here</span><span class="church-metric-value">${influence}/100</span><div class="church-presence-track"><div class="church-presence-fill" style="width:${influence}%"></div></div></div></div><div class="church-benefit">Presence is a gameplay estimate. Stronger relations and joint work grow local influence. This country currently adds +${localActionBonus(selectedCountry)} to matching local action rewards.</div>`;
        const actions=church.id==='Muslim'?[ 
          {id:'conversation',name:'Open an interfaith conversation',desc:'Meet local Muslim leaders and listen',cost:3,available:hasLifestylePerk('interfaith-envoys'),locked:'Unlock Interfaith envoys in the Diplomat lifestyle'},
          {id:'joint-mission',name:'Begin shared relief work',desc:'Serve local communities together',cost:8,available:hasLifestylePerk('shared-relief')&&relationship>=55,locked:hasLifestylePerk('shared-relief')?'Requires 55 relations':'Unlock Common cause in the Diplomat lifestyle'},
          {id:'interfaith-mediation',name:'Mediate a local dispute',desc:'Help community leaders reach a peaceful accord',cost:6,available:hasLifestylePerk('peace-broker')&&relationship>=40,locked:hasLifestylePerk('peace-broker')?'Requires 40 relations':'Unlock Peace broker in the Diplomat lifestyle'}
        ]:[
          {id:'conversation',name:'Open a conversation',desc:'Listen, exchange envoys, and build trust',cost:3,available:true,locked:''},
          {id:'joint-mission',name:'Begin joint mission work',desc:'Serve local communities together',cost:8,available:relationship>=55,locked:'Requires 55 relations'},
          {id:'public-debate',name:'Hold a public theological debate',desc:'Air disagreements in a public forum',cost:5,available:relationship>=25,locked:'Requires 25 relations'},
          {id:'doctrinal-crusade',name:'Call a doctrinal crusade',desc:'Nonviolent preaching campaign; unity may fray',cost:10,available:relationship<=25,locked:'Available at 25 relations or less'}
        ];
        $('#church-actions').innerHTML=actions.map(action=>`<button class="action-btn" type="button" data-church-action="${action.id}" ${!action.available||state.actions===0||state.treasury<action.cost?'disabled':''}><span class="action-glyph">${action.id==='joint-mission'?'⌂':action.id==='public-debate'?'⚖':action.id==='doctrinal-crusade'?'✦':'↔'}</span><span><span class="action-name">${action.name}</span><span class="action-desc">${action.available?action.desc:action.locked}</span></span><span class="action-cost">${action.available?`−${action.cost}m`:'LOCKED'}</span></button>`).join('');
      };
      const renderCourtPanel = () => {
        const country=currentCountry();
        $('#domain-country-label').textContent=selectedCountry;
        const stats=[
          {label:'Development',value:`${country.development}/100`,fill:country.development},
          {label:'Prosperity',value:`${country.prosperity}/100`,fill:country.prosperity},
          {label:'Local opinion',value:`${country.localOpinion}/100`,fill:country.localOpinion},
          {label:'Monthly income',value:`+${country.incomeBonus}m`,fill:Math.min(100,country.incomeBonus*30)}
        ];
        $('#domain-stats').innerHTML=stats.map(stat=>`<div class="domain-stat"><span class="domain-stat-label">${stat.label}</span><span class="domain-stat-value">${stat.value}</span><div class="domain-track"><div class="domain-track-fill" style="width:${stat.fill}%"></div></div></div>`).join('');
        const actions=[
          {id:'invest',name:'Develop diocesan land',desc:'Improve roads, schools, and local works',cost:12,locked:country.development>=92},
          {id:'relief',name:'Grant tax relief',desc:'Raise prosperity and local support',cost:8,locked:false},
          {id:'tithe',name:'Collect extraordinary tithe',desc:'Raise funds at the cost of local goodwill',cost:0,locked:false}
        ];
        $('#domain-actions').innerHTML=actions.map(action=>`<button class="action-btn" type="button" data-domain-action="${action.id}" ${state.actions===0||state.treasury<action.cost||action.locked?'disabled':''}><span class="action-glyph">${action.id==='invest'?'⌂':action.id==='relief'?'✚':'⌑'}</span><span><span class="action-name">${action.name}</span><span class="action-desc">${action.desc}</span></span><span class="action-cost">${action.cost?`−${action.cost}m`:'No cost'}</span></button>`).join('');
        $('#clergy-list').innerHTML=state.clergy.map(prelate=>{
          const office=Object.entries(state.appointments).find(([,id])=>id===prelate.id)?.[0]||'';
          const selectedOffice=state.courtChoices[prelate.id]??office;
          const officeOptions=Object.entries(COURT_OFFICES).map(([id,definition])=>`<option value="${id}" ${selectedOffice===id?'selected':''}>${definition.name}</option>`).join('');
          const officeName=office?COURT_OFFICES[office].name:'No office';
          return `<article class="clergy-card"><div class="clergy-card-head"><div><div class="clergy-name">${prelate.name}</div><div class="clergy-trait">${prelate.trait} · ${prelate.faction}</div></div><span class="clergy-office">${officeName}</span></div><div class="clergy-stats"><div><div class="clergy-stat-line">Opinion ${prelate.opinion}</div><div class="clergy-stat-track"><div class="clergy-stat-fill" style="width:${prelate.opinion}%"></div></div></div><div><div class="clergy-stat-line">Loyalty ${prelate.loyalty}</div><div class="clergy-stat-track"><div class="clergy-stat-fill" style="width:${prelate.loyalty}%"></div></div></div></div><div class="clergy-controls"><select class="clergy-office-select" data-office-choice="${prelate.id}" aria-label="Council office for ${prelate.name}"><option value="">Choose council office</option>${officeOptions}</select><button class="action-btn" type="button" data-court-action="appoint" data-prelate="${prelate.id}" ${state.actions===0||state.treasury<5||!selectedOffice?'disabled':''}>Appoint · 5m</button><button class="action-btn" type="button" data-court-action="audience" data-prelate="${prelate.id}" ${state.actions===0||state.treasury<2?'disabled':''}>Audience · 2m</button>${office?`<button class="action-btn dismiss-clergy" type="button" data-court-action="dismiss" data-prelate="${prelate.id}" ${state.actions===0?'disabled':''}>Dismiss</button>`:''}</div></article>`;
        }).join('');
      };
      const updateSetupPreview = () => {
        const archetype=ARCHETYPES[selectedArchetype()];
        const lifestyle=LIFESTYLES[$('#chosen-lifestyle')?.value||state.lifestyle];
        const origin=$('#origin-country').value;
        const order=$('#chosen-order')?.value||state.chosenOrder;
        $('#setup-preview').textContent=state.started?`Pope ${state.papalName}'s pontificate is underway. Begin a new one with the reset button.`:`${archetype.passiveText} ${lifestyle.description} ${ORDER_PERKS[order].text} Once per year: ${archetype.ability.name}. ${ORIGIN_BONUSES[origin].text}`;
      };
      const syncSetupForm = () => {
        ensureOrderPicker();
        ensureLifestylePicker();
        const originSelect=$('#origin-country');
        const originOptions=new Set(Array.from(originSelect.options,option=>option.value));
        Object.keys(state.countries).forEach(countryName=>{
          if(originOptions.has(countryName)) return;
          const option=document.createElement('option'); option.value=countryName; option.textContent=countryName; originSelect.append(option);
        });
        $('#papal-name').value=state.papalName;
        $('#origin-country').value=state.origin;
        $('#chosen-order').value=state.chosenOrder;
        $('#chosen-lifestyle').value=state.lifestyle;
        document.querySelectorAll('input[name="archetype"]').forEach(input=>input.checked=input.value===state.archetype);
        document.querySelectorAll('#customization-form input,#customization-form select').forEach(input=>input.disabled=state.started);
        $('#begin-button').textContent=state.started?'Continue the Pontificate  →':'Begin the Pontificate  →';
        updateSetupPreview();
      };
      const abilityAction = () => {
        const ability=ARCHETYPES[state.archetype].ability;
        const used=state.abilityUsedYear===state.year;
        return {id:'archetype-ability',glyph:'✠',name:ability.name,desc:ability.desc,treasuryCost:ability.treasuryCost,cost:used?'Once a year · used':`Once a year · −${ability.treasuryCost}m`,type:'ability'};
      };
      const lifestyleActions = () => hasLifestylePerk('council-of-voices')?[{id:'lifestyle-council',glyph:'✥',name:'Convene a universal synod',desc:'Bring reformers, traditionalists, and local bishops to the same table',treasuryCost:10,cost:state.lifestyleActionUsedYear===state.year?'Once a year · used':'Once a year · −10m',type:'lifestyle'}]:[];
      const save = () => {
        try { localStorage.setItem('peters-chair-save',JSON.stringify(state)); $('#save-label').textContent='Saved locally'; }
        catch { $('#save-label').textContent='Session only'; }
      };
      const load = () => {
        try { const saved=JSON.parse(localStorage.getItem('peters-chair-save')); if(saved&&saved.countries&&saved.factions) return saved; } catch {}
        return clone(INITIAL);
      };
      const note = (message) => {
        state.log.unshift({date:`${MONTHS[state.month].slice(0,3)} ${state.year}`,text:message});
        state.log=state.log.slice(0,5);
      };
      const toast = message => {
        const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2300);
      };
      const clampStats = () => {
        state.faithful=Math.max(10,state.faithful); state.connections=cap(state.connections,0,100);
        state.trust=cap(state.trust,0,100); state.treasury=Math.max(0,state.treasury);
        Object.keys(state.factions).forEach(k=>state.factions[k]=cap(state.factions[k],0,100));
        Object.keys(state.orders).forEach(k=>state.orders[k]=cap(state.orders[k],0,100));
        Object.values(state.countries).forEach(country=>{
          country.relations=cap(country.relations,0,100);
          country.development=cap(country.development,0,100);
          country.prosperity=cap(country.prosperity,0,100);
          country.localOpinion=cap(country.localOpinion,0,100);
          country.incomeBonus=cap(country.incomeBonus,0,50);
          country.faithfulGrowth=cap(country.faithfulGrowth,-10,30);
        });
        state.clergy.forEach(prelate=>{
          prelate.opinion=cap(prelate.opinion,0,100);
          prelate.loyalty=cap(prelate.loyalty,0,100);
        });
        Object.keys(state.churchRelations).forEach(church=>state.churchRelations[church]=cap(state.churchRelations[church],0,100));
      };
      const change = (effect, countryName) => {
        for(const key of ['faithful','connections','trust','treasury']) if(effect[key]) state[key]+=effect[key];
        if(effect.factions) for(const [key,value] of Object.entries(effect.factions)) if(state.factions[key]!==undefined) state.factions[key]+=value;
        if(effect.orders) for(const [key,value] of Object.entries(effect.orders)) if(state.orders[key]!==undefined) state.orders[key]+=value;
        if(effect.relations&&countryName) state.countries[countryName].relations+=effect.relations;
        if(effect.country&&countryName) {
          const country=state.countries[countryName];
          for(const [key,value] of Object.entries(effect.country)) if(Number.isFinite(country[key])) country[key]+=value;
        }
        if(effect.clergy) {
          const prelate=state.clergy.find(person=>person.id===effect.clergy.id);
          if(prelate) for(const key of ['opinion','loyalty']) if(Number.isFinite(effect.clergy[key])) prelate[key]+=effect.clergy[key];
        }
        if(effect.churchRelations) for(const [church,value] of Object.entries(effect.churchRelations)) if(Number.isFinite(state.churchRelations[church])) state.churchRelations[church]+=value;
        if(effect.localChurchWork&&countryName) {
          const country=state.countries[countryName]; const {church,amount}=effect.localChurchWork;
          if(Number.isFinite(state.churchRelations[church])) country.ecumenicalWork[church]=(country.ecumenicalWork[church]||0)+amount;
        }
        if(effect.dismissClergy) {
          for(const [office,prelateId] of Object.entries(state.appointments)) if(prelateId===effect.dismissClergy) delete state.appointments[office];
        }
        clampStats();
      };
      const formatEffect = amount => `${amount>0?'+':''}${amount}`;
      const render = () => {
        $('#brand-name').textContent=`Pope ${state.papalName}`;
        $('#brand-sub').textContent=`${ARCHETYPES[state.archetype].name} · from ${state.origin}`;
        $('#date-label').textContent=`${MONTHS[state.month]} ${state.year}`;
        $('#year-count').textContent=state.year-2030;
        $('#members-value').textContent=(state.faithful/1000).toFixed(2);
        $('#connections-value').textContent=state.connections;
        $('#treasury-value').textContent=state.treasury;
        $('#trust-value').textContent=state.trust;
        $('#members-fill').style.width=`${cap(state.faithful/20,0,100)}%`;
        $('#connections-fill').style.width=`${state.connections}%`;
        $('#treasury-fill').style.width=`${cap(state.treasury,0,100)}%`;
        $('#trust-fill').style.width=`${state.trust}%`;
        $('#members-change').textContent=`${formatEffect(state.faithful-state.yearStartFaithful)}m this year`;
        $('#connections-change').textContent=`${formatEffect(state.connections-state.yearStartConnections)} this year`;
        $('#trust-change').textContent=state.trust>=70?'Strong confidence':state.trust<35?'Confidence at risk':'Holding steady';
        $('#country-name').textContent=selectedCountry;
        $('#map-selected-label').textContent=selectedCountry;
        $('#country-context').textContent=currentCountry().context;
        const regionalInfluence=placeInfluence(selectedCountry);
        $('#ecumenical-summary').textContent=`Interchurch influence ${regionalInfluence}/100 · local action bonus +${localActionBonus(selectedCountry)}`;
        $('#country-origin').textContent=selectedCountry===state.origin?`YOUR HOME · ${ORIGIN_BONUSES[state.origin].text}`:'';
        $('#country-origin').hidden=selectedCountry!==state.origin;
        $('#country-faithful').textContent=`${currentCountry().faithful.toFixed(1)}m`;
        $('#country-relations').textContent=`${currentCountry().relations} / 100`;
        $('#country-bishop').textContent=currentCountry().bishop;
        $('#action-count').textContent=`${state.actions} action${state.actions===1?'':'s'} left`;
        const actions=[...ACTIONS,abilityAction(),...lifestyleActions()];
        $('#action-list').innerHTML=actions.map(a=>`<button class="action-btn" data-action="${a.id}" ${state.actions===0||state.treasury<a.treasuryCost||(a.type==='ability'&&state.abilityUsedYear===state.year)||(a.type==='lifestyle'&&state.lifestyleActionUsedYear===state.year)?'disabled':''}><span class="action-glyph">${a.glyph}</span><span><span class="action-name">${a.name}</span><span class="action-desc">${a.desc}</span></span><span class="action-cost">${a.cost}</span></button>`).join('');
        $('#faction-list').innerHTML=Object.entries(state.factions).map(([name,value])=>`<div class="faction-row"><span class="faction-name">${name}</span><div class="faction-track"><div class="faction-fill" style="width:${value}%;background:${value<35?'#ad554b':value>74?'#ae8a4b':'#668473'}"></div></div><span class="faction-value">${value}</span></div>`).join('');
        $('#order-grid').innerHTML=Object.entries(state.orders).map(([name,value])=>`<div class="order"><div class="order-name">${name}${name===state.chosenOrder?'<span class="order-preferred">YOUR ORDER</span>':''}</div><div class="order-strength">INFLUENCE ${value}</div><div class="order-bar"><div class="order-fill" style="width:${value}%"></div></div></div>`).join('');
        $('#log-list').innerHTML=state.log.length?state.log.map(item=>`<div class="log-entry"><span class="log-date">${escapeHTML(item.date)}</span><span class="log-text">${escapeHTML(item.text)}</span></div>`).join(''):'<div class="log-entry"><span class="log-date">TODAY</span><span class="log-text">The white smoke has cleared. The world is waiting.</span></div>';
        $('#month-box-value').textContent=`${MONTHS[state.month]} · ${state.year}`;
        $('#month-fill').style.width=`${((state.month+1)/12)*100}%`;
        $('#advance-button').disabled=state.actions>0;
        $('#advance-button').textContent=state.actions>0?`Conclude the month · ${state.actions} action${state.actions===1?'':'s'} remain`:'Conclude the month →';
        $('#footer-year').textContent=`Year ${state.year-2030} of the pontificate`;
        document.querySelectorAll('.map-place').forEach(node=>{
          const name=node.dataset.country; node.classList.toggle('selected',name===selectedCountry); node.classList.toggle('visited',state.visited.includes(name)); node.classList.toggle('home',name===state.origin);
          node.querySelector('.place-ring').setAttribute('r',String(5+placeInfluence(name)/25));
          node.setAttribute('role','button'); node.setAttribute('tabindex','0'); node.setAttribute('aria-label',`${name}${name===state.origin?' · home country':''}${state.visited.includes(name)?' · visited':''}`);
        });
        document.querySelectorAll('.country-shape').forEach(node=>node.classList.toggle('selected',node.dataset.country===selectedCountry));
        const route=[state.origin,...state.visited.filter(name=>name!==state.origin)];
        $('#visit-routes').innerHTML=route.slice(1).map((name,index)=>{
          const [startX,startY]=MAP_POINTS[route[index]]; const [endX,endY]=MAP_POINTS[name];
          const bend=Math.max(16,Math.abs(endX-startX)*.08);
          return `<path class="visit-route" d="M ${startX} ${startY} Q ${(startX+endX)/2} ${(startY+endY)/2-bend} ${endX} ${endY}"/>`;
        }).join('');
        renderChurchPanel();
        renderCourtPanel();
        renderLifestylePanel();
        save();
      };
      const setCountry = name => {
        if(!state.countries[name]) return;
        selectedCountry=name; render();
      };
      const doAction = id => {
        if(state.actions<1) return;
        const action=[...ACTIONS,abilityAction(),...lifestyleActions()].find(item=>item.id===id); if(!action) return;
        if(id==='archetype-ability'&&state.abilityUsedYear===state.year) { toast('Your special ability is available again next year.'); return; }
        if(id==='lifestyle-council'&&state.lifestyleActionUsedYear===state.year) { toast('Your synod may be convened again next year.'); return; }
        if(state.treasury<action.treasuryCost) { toast('The Apostolic treasury cannot cover this action.'); return; }
        const country=currentCountry();
        const firstVisit=id==='visit'&&!state.visited.includes(selectedCountry);
        if(id==='visit') {
          if(firstVisit) state.visited.push(selectedCountry);
          change({faithful:firstVisit?6:2,connections:3,trust:4,relations:9,factions:{'Local clergy':4,Youth:2}},selectedCountry);
          note(`An apostolic visit to ${selectedCountry} brought the faithful together. ${firstVisit?'A new mission now carries the memory of your visit.':'The local church welcomed your return.'}`);
          toast(`You arrived in ${selectedCountry}. The welcome was warm.`);
        } else if(id==='bishop') {
          if(country.relations<28) { toast('Relations are too strained to name a bishop. Open a dialogue first.'); return; }
          const old=country.bishop;
          country.bishop='Bp. '+['Marino','Bennett','Nwosu','Silva','Dela Cruz','Rahman','Sato','Martin'][state.totalActions%8];
          change({faithful:3,trust:1,relations:7,factions:{'Local clergy':3,Curia:2,Traditionalists:1}},selectedCountry);
          note(`A new bishop has been appointed in ${selectedCountry}, succeeding ${old}.`);
          toast(`A new shepherd has been appointed in ${selectedCountry}.`);
        } else if(id==='mission') {
          change({faithful:8,trust:2,relations:3,factions:{'Local clergy':4,Youth:2}},selectedCountry);
          note(`Apostolic funds will support schools and outreach in ${selectedCountry}.`);
          toast(`A mission grant is on its way to ${selectedCountry}.`);
        } else if(id==='dialogue') {
          change({connections:4,trust:1,relations:8,factions:{'Local clergy':2,Modernists:1}},selectedCountry);
          note(`A new channel of dialogue has opened with community leaders in ${selectedCountry}.`);
          toast(`Diplomatic ties with ${selectedCountry} have strengthened.`);
        } else if(id==='encyclical') {
          change({faithful:3,trust:2,factions:{Modernists:2,Traditionalists:2,Youth:1}},selectedCountry);
          note('A new encyclical called the universal Church to care for the poor and protect our common home.');
          toast('Your encyclical has been received around the world.');
        } else if(id==='orders') {
          const chosen=state.chosenOrder;
          change({trust:1,connections:2,orders:{[chosen]:state.archetype==='steward'?9:7},factions:{Curia:1,'Local clergy':2}});
          note(`The ${chosen} have been entrusted with a new apostolic work.`);
          toast(`The ${chosen} will lead a new apostolic work.`);
        } else if(id==='archetype-ability') {
          const ability=ARCHETYPES[state.archetype].ability;
          change(ability.effect);
          state.abilityUsedYear=state.year;
          note(`Pope ${state.papalName} used ${ability.name.toLowerCase()}.`);
          toast(`${ability.name} has strengthened the Church.`);
        } else if(id==='lifestyle-council') {
          change({trust:3,factions:{Modernists:4,Traditionalists:4,Curia:2,'Local clergy':3},connections:2});
          for(const church of CHURCHES) state.churchRelations[church.id]=cap(state.churchRelations[church.id]+2,0,100);
          state.lifestyleActionUsedYear=state.year;
          note(`Pope ${state.papalName} convened a universal synod to hear the whole Church.`);
          toast('The synod has opened a year of shared discernment.');
        }
        const archetype=ARCHETYPES[state.archetype];
        if(archetype.passiveAction===id&&id!=='orders') change(archetype.passive,selectedCountry);
        const orderPerk=ORDER_PERKS[state.chosenOrder];
        if(orderPerk.action===id) change(orderPerk.effect,selectedCountry);
        if(id==='visit'&&hasLifestylePerk('pilgrim-roads')) change({faithful:2},selectedCountry);
        if(id==='mission'&&hasLifestylePerk('field-chaplaincies')) change({faithful:3},selectedCountry);
        if(id==='visit'&&firstVisit&&hasLifestylePerk('great-pilgrimage')) change({trust:2},selectedCountry);
        if(id==='encyclical'&&hasLifestylePerk('encyclical-scholarship')) change({trust:2,factions:{Modernists:2}},selectedCountry);
        const originBonus=ORIGIN_BONUSES[state.origin];
        if(selectedCountry===state.origin&&originBonus.action===id) change(originBonus.effect,selectedCountry);
        if(action.type==='country') {
          const bonus=localActionBonus(selectedCountry);
          if(bonus>0) {
            const reward=id==='visit'||id==='mission'?'faithful':id==='dialogue'?'connections':'trust';
            change({[reward]:bonus},selectedCountry);
          }
        }
        state.treasury-=action.treasuryCost;
        gainLifestyleXp(id);
        state.actions--; state.totalActions++;
        const regionalEvent=selectedCountry==='Australia'?'Australia':selectedCountry==='China'?'China':null;
        if(id==='visit'&&regionalEvent&&!state.regionalEvents[regionalEvent]) { render(); showEvent(regionalEvent); return; }
        if(state.totalActions%3===0&&Math.random()<.72) { render(); showEvent(); return; }
        render();
      };
      const doChurchAction = id => {
        if(state.actions<1) return;
        const church=state.selectedChurch;
        const relationship=state.churchRelations[church];
        const country=state.countries[selectedCountry];
        const cost={conversation:3,'joint-mission':8,'public-debate':5,'doctrinal-crusade':10,'interfaith-mediation':6}[id];
        if(cost===undefined||state.treasury<cost) return;
        if(church==='Muslim'&&id==='conversation'&&!hasLifestylePerk('interfaith-envoys')) return;
        if(church==='Muslim'&&id==='joint-mission'&&(!hasLifestylePerk('shared-relief')||relationship<55)) return;
        if(church==='Muslim'&&id==='interfaith-mediation'&&(!hasLifestylePerk('peace-broker')||relationship<40)) return;
        if(church!=='Muslim'&&id==='interfaith-mediation') return;
        if(id==='joint-mission'&&relationship<55||id==='public-debate'&&relationship<25||id==='doctrinal-crusade'&&relationship>25) return;
        if(id==='conversation') {
          state.churchRelations[church]+=8;
          state.connections+=2; state.trust+=1;
          note(`Pope ${state.papalName} opened a conversation with ${church} leaders in ${selectedCountry}.`);
          toast(`Relations with ${church} leaders have warmed.`);
        } else if(id==='joint-mission') {
          state.churchRelations[church]+=5;
          country.ecumenicalWork[church]=(country.ecumenicalWork[church]||0)+12;
          state.faithful+=2; state.connections+=2; state.trust+=2;
          note(`${church} communities and Catholic partners began joint mission work in ${selectedCountry}.`);
          toast(`Joint mission work is growing local influence.`);
        } else if(id==='interfaith-mediation') {
          state.churchRelations.Muslim+=5;
          country.ecumenicalWork.Muslim=(country.ecumenicalWork.Muslim||0)+6;
          country.localOpinion=cap(country.localOpinion+5,0,100);
          state.connections+=4; state.trust+=3;
          note(`Pope ${state.papalName} helped Muslim and Catholic leaders mediate a local dispute in ${selectedCountry}.`);
          toast('The local communities reached a peaceful accord.');
        } else if(id==='public-debate') {
          const synodalListening=hasLifestylePerk('synodal-listening');
          state.churchRelations[church]-=synodalListening?5:8;
          state.connections+=synodalListening?3:1; state.trust+=synodalListening?4:2;
          state.factions.Traditionalists+=3; state.factions.Modernists+=1;
          note(`A public theological debate with ${church} leaders sharpened differences in ${selectedCountry}.`);
          toast(`Public debate drew attention to the differences.`);
        } else {
          state.churchRelations[church]-=15;
          country.ecumenicalWork[church]=(country.ecumenicalWork[church]||0)+10;
          state.connections-=3; state.trust+=2;
          state.factions.Traditionalists+=7; state.factions.Modernists-=4;
          note(`Pope ${state.papalName} called a nonviolent doctrinal crusade against ${church} influence in ${selectedCountry}.`);
          toast(`The doctrinal crusade rallied some voices and damaged Christian unity.`);
        }
        state.churchRelations[church]=cap(state.churchRelations[church],0,100);
        if(church==='Muslim'&&id==='joint-mission'&&hasLifestylePerk('shared-relief')) {
          country.localOpinion=cap(country.localOpinion+3,0,100);
          state.trust=cap(state.trust+1,0,100);
        }
        state.connections=cap(state.connections,0,100); state.trust=cap(state.trust,0,100);
        state.factions.Traditionalists=cap(state.factions.Traditionalists,0,100);
        state.factions.Modernists=cap(state.factions.Modernists,0,100);
        state.treasury-=cost; gainLifestyleXp(id); state.actions--; state.totalActions++;
        if(state.totalActions%3===0&&Math.random()<.72) { render(); showEvent(); return; }
        render();
      };
      const finishCourtAction = (cost,activity='audience') => {
        state.treasury-=cost; gainLifestyleXp(activity); state.actions--; state.totalActions++;
        if(state.totalActions%3===0&&Math.random()<.72) { render(); showEvent(); return; }
        render();
      };
      const doCourtAction = (action,id) => {
        const prelate=state.clergy.find(person=>person.id===id);
        if(!prelate||state.actions<1) return;
        if(action==='audience') {
          if(state.treasury<2) return;
          prelate.opinion=cap(prelate.opinion+10,0,100);
          prelate.loyalty=cap(prelate.loyalty+5,0,100);
          state.trust=cap(state.trust+1,0,100);
          if(state.factions[prelate.faction]!==undefined) state.factions[prelate.faction]=cap(state.factions[prelate.faction]+1,0,100);
          note(`Pope ${state.papalName} held an audience with ${prelate.name}. Their opinion of the papacy improved.`);
          toast(`${prelate.name} left the audience more favorably disposed.`);
          finishCourtAction(2); return;
        }
        const currentOffice=Object.entries(state.appointments).find(([,personId])=>personId===id)?.[0];
        if(action==='dismiss') {
          if(!currentOffice) return;
          delete state.appointments[currentOffice];
          prelate.loyalty=cap(prelate.loyalty-8,0,100);
          note(`${prelate.name} was dismissed as ${COURT_OFFICES[currentOffice].name}.`);
          toast(`${prelate.name} has left the council.`);
          finishCourtAction(0,'dismiss'); return;
        }
        const office=state.courtChoices[id];
        if(action!=='appoint'||!COURT_OFFICES[office]||state.treasury<5) return;
        for(const [assignedOffice,personId] of Object.entries(state.appointments)) {
          if(personId===id||assignedOffice===office) delete state.appointments[assignedOffice];
        }
        state.appointments[office]=id;
        prelate.opinion=cap(prelate.opinion+4,0,100);
        prelate.loyalty=cap(prelate.loyalty+8,0,100);
        if(state.factions[prelate.faction]!==undefined) state.factions[prelate.faction]=cap(state.factions[prelate.faction]+2,0,100);
        note(`Pope ${state.papalName} appointed ${prelate.name} as ${COURT_OFFICES[office].name}.`);
        toast(`${prelate.name} has joined the council.`);
        finishCourtAction(5,'appoint');
      };
      const doDomainAction = action => {
        const country=currentCountry();
        if(state.actions<1) return;
        if(action==='invest') {
          const cost=hasLifestylePerk('land-survey')?9:12;
          if(state.treasury<cost||country.development>=92) return;
          country.development=cap(country.development+(hasLifestylePerk('land-survey')?10:8),0,100);
          country.prosperity=cap(country.prosperity+7,0,100);
          country.incomeBonus++;
          country.faithfulGrowth++;
          note(`Pope ${state.papalName} invested in roads and public works in ${selectedCountry}.`);
          toast(`${selectedCountry} is developing; its domain now earns +1m monthly.`);
          state.treasury-=cost;
        } else if(action==='relief') {
          const cost=hasLifestylePerk('relief-networks')?6:8;
          if(state.treasury<cost) return;
          country.prosperity=cap(country.prosperity+9,0,100);
          country.localOpinion=cap(country.localOpinion+(hasLifestylePerk('relief-networks')?17:12),0,100);
          country.relations=cap(country.relations+2,0,100);
          state.trust=cap(state.trust+1,0,100);
          note(`Tax relief was granted to communities in ${selectedCountry}, improving local support.`);
          toast(`Local opinion in ${selectedCountry} has improved.`);
          state.treasury-=cost;
        } else if(action==='tithe') {
          const revenue=5+Math.floor(country.development/20);
          state.treasury+=revenue;
          country.localOpinion=cap(country.localOpinion-12,0,100);
          country.prosperity=cap(country.prosperity-4,0,100);
          country.relations=cap(country.relations-3,0,100);
          note(`An extraordinary tithe from ${selectedCountry} raised ${revenue}m, but local support suffered.`);
          toast(`${revenue}m raised; ${selectedCountry} is less content.`);
        } else return;
        gainLifestyleXp(action); state.actions--; state.totalActions++;
        if(state.totalActions%3===0&&Math.random()<.72) { render(); showEvent(); return; }
        render();
      };
      const situationalEvents = () => {
        const events=[];
        const strainedCountry=Object.entries(state.countries)
          .filter(([,country])=>country.localOpinion<=38||country.prosperity<=34)
          .sort(([,first],[,second])=>(first.localOpinion+first.prosperity)-(second.localOpinion+second.prosperity))[0];
        if(strainedCountry) {
          const [countryName,country]=strainedCountry;
          events.push({
            kicker:'A petition reaches Rome',
            title:country.localOpinion<=38?'Local patience is running thin':'A hard season for the diocese',
            copy:`The bishop of ${countryName} reports that strained households are losing confidence in the local church. Relief could help, but the Apostolic treasury has other claims.`,
            countryName,
            weight:2+Math.floor((100-country.localOpinion)/18),
            choices:[
              {label:'Fund parish relief and food stores',outcome:'−9m · +12 local opinion · +4 prosperity',effect:{treasury:-9,trust:2,country:{localOpinion:12,prosperity:4},relations:2}},
              {label:'Ask the local clergy to lead the response',outcome:'+6 local opinion · +4 clergy standing',effect:{country:{localOpinion:6},factions:{'Local clergy':4},trust:1}},
              {label:'Defer the petition and protect reserves',outcome:'+5m · −10 local opinion · −1 trust',effect:{treasury:5,trust:-1,country:{localOpinion:-10,prosperity:-3}}}
            ]
          });
        }
        const uneasyPrelate=state.clergy
          .filter(person=>person.loyalty<55||person.opinion<42)
          .sort((first,second)=>(first.loyalty+first.opinion)-(second.loyalty+second.opinion))[0];
        if(uneasyPrelate) {
          const office=Object.entries(state.appointments).find(([,personId])=>personId===uneasyPrelate.id)?.[0];
          events.push({
            kicker:'Whispers in the Apostolic Palace',
            title:'A councillor asks to be heard',
            copy:`${uneasyPrelate.name}${office?`, the ${COURT_OFFICES[office].name}`:''}, has grown uneasy with the direction of the pontificate. Their ${uneasyPrelate.trait.toLowerCase()} voice still carries weight with ${uneasyPrelate.faction}.`,
            weight:3+Math.floor((100-uneasyPrelate.loyalty)/20),
            choices:[
              {label:'Hear their grievance in private',outcome:'−6m · +12 opinion · +14 loyalty',effect:{treasury:-6,clergy:{id:uneasyPrelate.id,opinion:12,loyalty:14}}},
              {label:'Reassure their faction at the next audience',outcome:'+8 opinion · +7 loyalty · +2 faction standing',effect:{clergy:{id:uneasyPrelate.id,opinion:8,loyalty:7},factions:{[uneasyPrelate.faction]:2}}},
              {label:'Dismiss their concerns and press ahead',outcome:'−14 opinion · −16 loyalty · dismiss from office',effect:{trust:1,clergy:{id:uneasyPrelate.id,opinion:-14,loyalty:-16},dismissClergy:uneasyPrelate.id}}
            ]
          });
        }
        const selectedChurch=RELIGIOUS_COMMUNITIES.find(church=>church.id===state.selectedChurch);
        const selectedPresence=LOCAL_CHURCH_PRESENCE[selectedCountry]?.[state.selectedChurch]||0;
        if(selectedChurch&&(selectedChurch.id!=='Muslim'||hasLifestylePerk('interfaith-envoys'))&&state.churchRelations[selectedChurch.id]>=58&&selectedPresence>=25) {
          events.push({
            kicker:'An ecumenical opening',
            title:'A shared witness is possible',
            copy:`In ${selectedCountry}, ${selectedChurch.name.toLowerCase()} leaders have proposed a joint response to local hardship. Relations are warm enough to make the invitation meaningful.`,
            countryName:selectedCountry,
            weight:2+Math.floor(state.churchRelations[selectedChurch.id]/25),
            choices:[
              {label:'Begin a shared local mission',outcome:'−7m · +6 relations · +10 local influence',effect:{treasury:-7,connections:2,churchRelations:{[selectedChurch.id]:6},localChurchWork:{church:selectedChurch.id,amount:10},country:{localOpinion:4}}},
              {label:'Invite leaders to a public day of service',outcome:'+3 relations · +3 local opinion',effect:{trust:2,churchRelations:{[selectedChurch.id]:3},country:{localOpinion:3}}},
              {label:'Keep cooperation informal for now',outcome:'+1 trust · −2 relations',effect:{trust:1,churchRelations:{[selectedChurch.id]:-2}}}
            ]
          });
        }
        if(selectedCountry==='Australia'&&state.visited.includes('Australia')&&!state.regionalEvents.Australia) {
          events.push({
            id:'Australia',
            kicker:'A dispatch from the Pacific',
            title:'A season of fire in Australia',
            copy:'Bushfires have displaced families and strained parish relief networks across Australia. The bishops ask Rome to help decide whether to fund immediate aid or build resilience for the next season.',
            countryName:'Australia',
            weight:5,
            choices:[
              {label:'Send emergency relief through parish networks',outcome:'−10m · +12 local opinion · +6 prosperity',effect:{treasury:-10,trust:2,country:{localOpinion:12,prosperity:6},relations:3}},
              {label:'Build permanent community resilience centers',outcome:'−8m · +4 development · +1m monthly income',effect:{treasury:-8,country:{development:4,prosperity:3,incomeBonus:1,localOpinion:5}}},
              {label:'Invite other churches into a shared response',outcome:'+4 ecumenical relations · +5 local influence',effect:{connections:2,churchRelations:{Evangelical:4},localChurchWork:{church:'Evangelical',amount:5},country:{localOpinion:4}}}
            ]
          });
        }
        if(selectedCountry==='China'&&state.visited.includes('China')&&state.countries.China.relations<72&&!state.regionalEvents.China) {
          events.push({
            id:'China',
            kicker:'A diplomatic opening in Beijing',
            title:'A careful path for local bishops',
            copy:'Officials have invited the Holy See to continue talks on pastoral appointments. Local Catholics hope for greater stability, while voices in the Curia urge care over the terms.',
            countryName:'China',
            weight:5,
            choices:[
              {label:'Negotiate a formal appointment framework',outcome:'+10 relations · +4 ties · +3 local opinion',effect:{connections:4,trust:1,relations:10,country:{localOpinion:3}}},
              {label:'Insist on greater local church freedom',outcome:'−8 relations · +3 traditionalist standing · +2 trust',effect:{trust:2,relations:-8,factions:{Traditionalists:3,Curia:-1}}},
              {label:'Continue gradual pastoral exchanges',outcome:'+5 relations · +3 ties · +2 local opinion',effect:{connections:3,relations:5,country:{localOpinion:2,prosperity:1}}}
            ]
          });
        }
        if(state.treasury<25) {
          events.push({
            kicker:'A note from the Prefecture of the Economy',
            title:'The treasury is running short',
            copy:`The Apostolic accounts hold ${state.treasury}m, and several dioceses are waiting on promised support. You can slow spending, borrow confidence from the orders, or demand more from a strained locality.`,
            weight:3+Math.floor((25-state.treasury)/5),
            choices:[
              {label:'Pause nonessential projects',outcome:'+8m · −2 trust',effect:{treasury:8,trust:-2}},
              {label:'Ask your preferred order to underwrite relief',outcome:'+5m · +3 order influence',effect:{treasury:5,orders:{[state.chosenOrder]:3},factions:{Curia:1}}},
              {label:'Collect another extraordinary tithe',outcome:'+10m · −8 local opinion · −2 trust',effect:{treasury:10,trust:-2,country:{localOpinion:-8,prosperity:-3},relations:-2}}
            ]
          });
        }
        return events;
      };
      const showEvent = preferredRegionalEvent => {
        const situational=situationalEvents();
        let event=situational.find(candidate=>candidate.id===preferredRegionalEvent);
        if(!event) {
          const candidates=[...EVENTS.map(candidate=>({event:candidate,weight:1})),...situational.map(candidate=>({event:candidate,weight:candidate.weight}))];
          const totalWeight=candidates.reduce((total,candidate)=>total+candidate.weight,0);
          let selection=Math.random()*totalWeight;
          event=candidates[candidates.length-1].event;
          for(const candidate of candidates) {
            selection-=candidate.weight;
            if(selection<=0) { event=candidate.event; break; }
          }
        }
        $('.timer-wrap').style.display='flex';
        $('#event-kicker').textContent=event.kicker; $('#event-title').textContent=event.title; $('#event-copy').textContent=event.copy;
        $('#event-choices').innerHTML=event.choices.map((choice,index)=>`<button class="choice" data-choice="${index}"><span class="choice-label">${choice.label}</span><span class="choice-outcome">${choice.outcome}</span></button>`).join('');
        $('#event-modal').classList.add('open');
        let remaining=18;
        $('#timer-label').textContent=`Decision in ${remaining}`; $('#timer-fill').style.transform='scaleX(1)';
        clearInterval(eventTimer);
        eventTimer=setInterval(()=>{
          remaining--;
          $('#timer-label').textContent=`Decision in ${remaining}`;
          $('#timer-fill').style.transform=`scaleX(${remaining/18})`;
          if(remaining<=0) resolveEvent(event,2,true);
        },1000);
        $('#event-choices').onclick=e=>{const button=e.target.closest('[data-choice]'); if(button) resolveEvent(event,Number(button.dataset.choice),false);};
      };
      const resolveEvent = (event,index,timedOut) => {
        if(!$('#event-modal').classList.contains('open')) return;
        clearInterval(eventTimer); $('#event-modal').classList.remove('open');
        const choice=event.choices[index]; change(choice.effect,event.countryName);
        if(event.id&&state.regionalEvents[event.id]!==undefined) state.regionalEvents[event.id]=true;
        state.eventCount++;
        const short=choice.label.replace(/[.!?]+$/,'');
        note(`${timedOut?'With no answer before the deadline, the default course was set: ':'You chose to '}${timedOut?short.toLowerCase():short.charAt(0).toLowerCase()+short.slice(1)}.`);
        toast(timedOut?'Time passed. The matter was settled by default.':'Your decision has been recorded.');
        render();
      };
      const advanceMonth = () => {
        if(state.actions>0) return;
        const monthName=MONTHS[state.month];
        for(const prelate of state.clergy) {
          const factionStanding=state.factions[prelate.faction]||50;
          if(factionStanding<30) { prelate.loyalty-=2; prelate.opinion-=1; }
          else if(factionStanding>75) prelate.loyalty+=1;
          if(state.trust<30) prelate.opinion-=1;
          prelate.loyalty=cap(prelate.loyalty,0,100); prelate.opinion=cap(prelate.opinion,0,100);
        }
        const councilYield={faithful:0,connections:0,trust:0,treasury:0};
        for(const [officeId,prelateId] of Object.entries(state.appointments)) {
          const prelate=state.clergy.find(person=>person.id===prelateId); const office=COURT_OFFICES[officeId];
          if(!prelate||!office||prelate.loyalty<35) continue;
          const amount=Math.max(1,Math.floor(prelate.skills[office.skill]/10)+(prelate.loyalty>=80?1:0));
          councilYield[office.yield]+=amount;
        }
        const domainIncome=Object.values(state.countries).reduce((total,country)=>total+country.incomeBonus,0);
        const domainGrowth=Object.values(state.countries).reduce((total,country)=>total+country.faithfulGrowth,0);
        state.faithful+=Math.round((state.factions.Youth-50)/12 + (state.trust-50)/15 + (state.factions['Local clergy']-50)/18)+domainGrowth+councilYield.faithful;
        state.connections=cap(state.connections+councilYield.connections,0,100);
        state.trust=cap(state.trust+councilYield.trust,0,100);
        const monthlyIncome=15+(ORDER_PERKS[state.chosenOrder].monthlyIncome||0)+(hasLifestylePerk('balanced-ledgers')?2:0)+domainIncome+councilYield.treasury;
        state.treasury+=monthlyIncome;
        state.month++; state.actions=3;
        if(state.month>=12) {
          state.month=0; state.year++;
          state.faithful+=Math.round((state.factions['Local clergy']+state.factions.Youth-100)/5);
          state.treasury+=8;
          state.yearStartFaithful=state.faithful; state.yearStartConnections=state.connections;
          note(`The year closes. The faithful now number ${(state.faithful/1000).toFixed(2)} billion; annual accounts receive 13m.`);
          if(state.year>=2041) {
            render(); showFinale(); return;
          }
          toast(`A new year begins. The Church enters ${state.year} with hope.`);
        } else {
          note(`The ${monthName} accounts are closed. The Apostolic See receives ${monthlyIncome}m in revenue.`);
        }
        render();
        if(Math.random()<.35) setTimeout(showEvent,400);
      };
      const showFinale = () => {
        const success=state.faithful>=1400&&state.trust>=38&&state.treasury>=5;
        $('#event-kicker').textContent=success?'The conclave assembles':'A pontificate in review';
        $('#event-title').textContent=success?'Your legacy endures.':'A difficult reckoning.';
        $('#event-copy').textContent=`After ten years, the Church numbers ${(state.faithful/1000).toFixed(2)} billion faithful. Your public trust stands at ${state.trust}, diplomatic ties at ${state.connections}, and the Apostolic treasury at ${state.treasury}m. ${success?'The cardinals gather to reflect on a decade of service.':'The cardinals must now decide how to restore stability and renew the Church.'}`;
        $('#event-choices').innerHTML=`<button class="choice" id="final-choice"><span class="choice-label">${success?'Conclude the pontificate':'Begin again'}</span><span class="choice-outcome">${success?'A decade of service':'New conclave'}</span></button>`;
        $('#event-modal').classList.add('open'); $('.timer-wrap').style.display='none';
        $('#event-choices').onclick=()=>{localStorage.removeItem('peters-chair-save'); state=clone(INITIAL); selectedCountry='Italy'; $('#event-modal').classList.remove('open'); $('#intro').classList.remove('hidden'); syncSetupForm(); render();};
      };
      const begin = event => {
        event.preventDefault();
        if(!state.started) {
          const name=$('#papal-name').value.trim();
          if(!name) { $('#papal-name').reportValidity(); return; }
          state.papalName=name.slice(0,24);
          state.origin=$('#origin-country').value;
          state.archetype=selectedArchetype();
          state.lifestyle=$('#chosen-lifestyle').value;
          state.chosenOrder=$('#chosen-order').value;
          state.lifestyleXp=0; state.lifestylePoints=0; state.unlockedPerks=[];
          state.started=true;
          state.abilityUsedYear=0;
          state.lifestyleActionUsedYear=0;
          state.orders[state.chosenOrder]=cap(state.orders[state.chosenOrder]+12,0,100);
          selectedCountry=state.origin;
          note(`Pope ${state.papalName} begins a new pontificate with the ${state.chosenOrder}.`);
        }
        $('#intro').classList.add('hidden');
        render();
      };
      state=load();
      if(state.year>2040) state=clone(INITIAL);
      state.countries={...clone(INITIAL.countries),...state.countries};
      state.papalName=typeof state.papalName==='string'&&state.papalName.trim()?state.papalName:'Leo';
      state.archetype=ARCHETYPES[state.archetype]?state.archetype:'diplomat';
      state.lifestyle=LIFESTYLES[state.lifestyle]?state.lifestyle:'diplomacy';
      state.lifestyleXp=Number.isFinite(state.lifestyleXp)?cap(state.lifestyleXp,0,2):0;
      state.lifestylePoints=Number.isFinite(state.lifestylePoints)?Math.max(0,state.lifestylePoints):0;
      state.unlockedPerks=Array.isArray(state.unlockedPerks)?state.unlockedPerks.filter(perk=>LIFESTYLE_PERKS[state.lifestyle].some(item=>item.id===perk)):[];
      state.lifestyleActionUsedYear=Number.isFinite(state.lifestyleActionUsedYear)?state.lifestyleActionUsedYear:0;
      state.origin=state.countries[state.origin]?state.origin:'Italy';
      state.chosenOrder=ORDER_PERKS[state.chosenOrder]?state.chosenOrder:'Jesuits';
      state.churchRelations=state.churchRelations&&typeof state.churchRelations==='object'?{...clone(INITIAL.churchRelations),...state.churchRelations}:clone(INITIAL.churchRelations);
      state.selectedChurch=RELIGIOUS_COMMUNITIES.some(church=>church.id===state.selectedChurch)?state.selectedChurch:'Lutheran';
      state.regionalEvents={...clone(INITIAL.regionalEvents),...(state.regionalEvents||{})};
      state.clergy=Array.isArray(state.clergy)?state.clergy:clone(INITIAL.clergy);
      state.appointments=state.appointments&&typeof state.appointments==='object'?{...clone(INITIAL.appointments),...state.appointments}:clone(INITIAL.appointments);
      state.courtChoices=state.courtChoices&&typeof state.courtChoices==='object'?state.courtChoices:{};
      initializeCountryManagement(state.countries);
      state.abilityUsedYear=Number.isFinite(state.abilityUsedYear)?state.abilityUsedYear:0;
      if(state.started===undefined) state.started=state.year!==INITIAL.year||state.month!==INITIAL.month||(state.totalActions||0)>0||(state.visited||[]).length>0;
      if(state.started&&!state.log.length) note(`Pope ${state.papalName}'s pontificate continues.`);
      selectedCountry=state.origin;
      syncSetupForm();
      document.addEventListener('click',event=>{
        const mapTarget=event.target.closest('[data-country]'); if(mapTarget) setCountry(mapTarget.dataset.country);
        const actionTarget=event.target.closest('[data-action]'); if(actionTarget) doAction(actionTarget.dataset.action);
        const tabTarget=event.target.closest('[data-side-tab]'); if(tabTarget) setSideTab(tabTarget.dataset.sideTab);
        const churchTarget=event.target.closest('[data-church]'); if(churchTarget) { state.selectedChurch=churchTarget.dataset.church; setSideTab('churches'); render(); }
        const churchAction=event.target.closest('[data-church-action]'); if(churchAction) doChurchAction(churchAction.dataset.churchAction);
        const perkTarget=event.target.closest('[data-perk-unlock]'); if(perkTarget) unlockLifestylePerk(perkTarget.dataset.perkUnlock);
        const courtAction=event.target.closest('[data-court-action]'); if(courtAction) doCourtAction(courtAction.dataset.courtAction,courtAction.dataset.prelate);
        const domainAction=event.target.closest('[data-domain-action]'); if(domainAction) doDomainAction(domainAction.dataset.domainAction);
      });
      document.addEventListener('keydown',event=>{
        const mapTarget=event.target.closest('.map-place');
        if(mapTarget&&(event.key==='Enter'||event.key===' ')) { event.preventDefault(); setCountry(mapTarget.dataset.country); }
      });
      $('#origin-country').addEventListener('change',updateSetupPreview);
      $('#chosen-lifestyle').addEventListener('change',updateSetupPreview);
      document.querySelectorAll('input[name="archetype"]').forEach(input=>input.addEventListener('change',updateSetupPreview));
      document.addEventListener('change',event=>{
        const select=event.target.closest('[data-office-choice]');
        if(select) { state.courtChoices[select.dataset.officeChoice]=select.value; render(); }
      });
      $('#advance-button').addEventListener('click',advanceMonth);
      $('#customization-form').addEventListener('submit',begin);
      $('#reset-button').addEventListener('click',()=>{ if(confirm('Begin a new pontificate? Your current campaign will be erased.')) { localStorage.removeItem('peters-chair-save'); clearInterval(eventTimer); state=clone(INITIAL); selectedCountry='Italy'; $('#event-modal').classList.remove('open'); $('#intro').classList.remove('hidden'); syncSetupForm(); render(); } });
      render();
    })();
  