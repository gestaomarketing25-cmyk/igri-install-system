import OpenAI from 'openai';
import type { AiRecommendation, CableItem } from './types';

function fallback(input: any): AiRecommendation {
  const envs: string[] = input.environments || [];
  const cables: CableItem[] = input.cabling || [];
  const pref = input.router_preference || 'Não informada';
  const tv = cables.find(x => /tv|iptv|box/i.test(x.device));
  const central = envs.find(x => /sala|corredor|central/i.test(x)) || envs[0] || 'ponto central do imóvel';
  let recommended = central;
  let rationale = 'Priorizar um ponto aberto e central em relação aos ambientes de maior uso, reduzindo obstáculos e distância.';
  if (tv?.room && envs.some(e => e.toLowerCase().includes(tv.room.toLowerCase()))) {
    recommended = tv.room;
    rationale = 'O local concentra uso relevante e permite cabeamento curto para a televisão, desde que os testes confirmem boa cobertura dos demais ambientes.';
  }
  const conflict = pref && !recommended.toLowerCase().includes(pref.toLowerCase())
    ? `A preferência do cliente (${pref}) não deve prevalecer se os testes mostrarem pior cobertura. Priorizar ${recommended}.`
    : 'A preferência do cliente pode ser utilizada se os testes no local confirmarem boa cobertura.';
  return {
    recommended_router_location: recommended,
    rationale,
    preferred_location: pref,
    preference_conflict: conflict,
    preferred_height: 'Preferencialmente entre 1,5 m e 2,0 m do piso, em local aberto, ventilado e sem ficar escondido atrás de móveis ou dentro de armários.',
    tv_proximity_guidance: tv ? `Quando tecnicamente possível e sem prejudicar o Wi‑Fi, posicionar próximo à ${tv.device} em ${tv.room} para facilitar o cabo Ethernet.` : 'Quando houver televisão prioritária, avaliar proximidade para cabeamento apenas se isso não reduzir a qualidade do Wi‑Fi.',
    cabling_plan: cables.map(x => ({ device: x.device, room: x.room || 'Local não informado', should_cable: true, reason: 'Equipamento indicado pelo cliente para maior estabilidade.' })),
    wifi_checks: [...new Set([...(envs.length ? envs : ['Ambiente principal']), 'Próximo ao roteador'])],
    installer_notes: [
      'Validar o ponto sugerido com teste real de sinal antes de fixar o equipamento.',
      'Evitar instalar o roteador no chão, dentro de armários, atrás da TV ou encostado em grandes superfícies metálicas.',
      'Registrar qualquer mudança em relação à recomendação e o motivo técnico.'
    ],
    risk_flags: input.property_type?.toLowerCase().includes('sobrado') ? ['Imóvel com mais de um pavimento: avaliar cobertura vertical e necessidade de Mesh/AP adicional.'] : []
  };
}

export async function analyzeBriefing(input: any): Promise<{ recommendation: AiRecommendation; source: string }> {
  if (!process.env.OPENAI_API_KEY) return { recommendation: fallback(input), source: 'rules' };
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-6-luna',
      input: [
        { role: 'system', content: 'Você é um engenheiro de redes residenciais da IGRI Telecom. Analise um briefing de instalação de fibra e produza recomendação objetiva para o técnico. Priorize cobertura Wi-Fi, estabilidade, centralidade, obstáculos, quantidade de ambientes e cabeamento de equipamentos críticos. Se for possível sem prejudicar o Wi-Fi, prefira um ponto próximo à televisão para facilitar cabo Ethernet. A preferência do cliente não deve prevalecer quando tecnicamente pior. Nunca garanta funcionamento de IPTV de terceiros. Retorne SOMENTE JSON válido.' },
        { role: 'user', content: JSON.stringify({
          briefing: input,
          output_schema: {
            recommended_router_location:'string', rationale:'string', preferred_location:'string', preference_conflict:'string', preferred_height:'string', tv_proximity_guidance:'string',
            cabling_plan:[{device:'string',room:'string',should_cable:true,reason:'string'}], wifi_checks:['string'], installer_notes:['string'], risk_flags:['string']
          }
        }) }
      ]
    });
    const text = response.output_text.trim().replace(/^\`\`\`json\s*/,'').replace(/\`\`\`$/,'');
    return { recommendation: JSON.parse(text), source: 'openai' };
  } catch (e) {
    console.error('AI fallback:', e);
    return { recommendation: fallback(input), source: 'rules-fallback' };
  }
}
