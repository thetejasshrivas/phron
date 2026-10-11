import {describe,expect,it,jest} from '@jest/globals';
import {extractWithFallback} from '@/server/finance/providers';
const facts={transactions:[{amount:'150',merchant_or_payee:'chai',candidate_category:'Dining Out & Social',is_estimated:false,relative_date_offset_days:0}]};
const ok=()=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(facts)}]}}]}));
describe('PH28 documented provider wire regression',()=>{
 it('sends only documented Gemini Schema fields recursively; retains strict local validation',async()=>{
  const fetcher=jest.fn<typeof fetch>().mockResolvedValue(ok());
  const result=await extractWithFallback('150 chai',{geminiApiKey:'test-only',fetcher});
  expect(result).toMatchObject({kind:'extracted',transactions:[{amountPaise:'15000'}]});
  const body=JSON.parse(String(fetcher.mock.calls[0]![1]?.body));
  const allowed=new Set(['type','required','properties','items','description','enum','minItems','maxItems','minimum','maximum']);
  function check(schema:Record<string,unknown>){for(const key of Object.keys(schema))expect(allowed.has(key)).toBe(true);if(schema.properties)for(const child of Object.values(schema.properties as Record<string,Record<string,unknown>>))check(child);if(schema.items)check(schema.items as Record<string,unknown>);}
  check(body.generationConfig.responseSchema);
  expect(body.generationConfig.responseSchema.properties.transactions.items.required).toHaveLength(5);
 });
 it('keeps the verified Groq endpoint, Bearer authorization and prescribed active model',async()=>{
  const fetcher=jest.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(facts)}}]})));
  await extractWithFallback('150 chai',{groqApiKey:'test-only',fetcher});
  const [url,init]=fetcher.mock.calls[0]!;
  expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
  expect(init?.headers).toEqual({'content-type':'application/json',authorization:'Bearer test-only'});
  expect(JSON.parse(String(init?.body)).model).toBe('llama-3.3-70b-versatile');
 });
});
