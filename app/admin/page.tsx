import {requireSignedInUser} from '../google-auth';
import {auth} from '../data-server';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Admin(){await requireSignedInUser('/admin');const u=await auth();if(u?.role!=='ADMIN')return <main className="login-page"><h1>Administrator access required</h1><p>Your account can use the learner workspace.</p><a href="/" className="primary">Open my workspace</a></main>;redirect('/?portal=admin');}
