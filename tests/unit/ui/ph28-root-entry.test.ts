import type {ReactNode} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,test} from '@jest/globals';
import Root from '@/app/page';

test('root exposes the trusted Google POST entry instead of the skeleton placeholder',async()=>{
 const renderRoot=Root as unknown as (props:{searchParams:Promise<Record<string,string>>})=>ReactNode|Promise<ReactNode>;
 const html=renderToStaticMarkup(await renderRoot({searchParams:Promise.resolve({})}));
 expect(html).toContain('action="/api/auth/google"');
 expect(html).toContain('method="post"');
 expect(html).toContain('Continue with Google');
 expect(html).not.toContain('Coming soon');
});
