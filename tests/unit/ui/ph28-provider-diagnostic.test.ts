import {expect,test} from '@jest/globals';
import {providerFailureDiagnostic} from '@/server/finance/providers';

test('diagnostics report invalid credentials without copying raw upstream text',()=>{
 const raw={error:{code:400,message:'API key not valid. PRIVATE_KEY merchant ₹12 identity@example.test'}};
 const result=providerFailureDiagnostic('gemini',400,raw);
 expect(result).toEqual({event:'provider_failure',provider:'gemini',httpStatus:400,reason:'API_KEY_INVALID'});
 expect(JSON.stringify(result)).not.toMatch(/PRIVATE_KEY|merchant|₹|identity/);
});
