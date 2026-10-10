import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,test} from '@jest/globals';
import {Onboarding} from '@/components/auth/Onboarding';
test('onboarding has explicit truthful privacy acknowledgement without falsely promising zero retention',()=>{
 const html=renderToStaticMarkup(createElement(Onboarding));
 expect(html).toContain('name="privacy-consent"');
 expect(html).toContain('type="checkbox" required=""');
 expect(html).toContain('Gemini');expect(html).toContain('Groq');
 expect(html).toContain('No financial profile totals');
 expect(html).not.toContain('No bank connection or AI processing.');
});
