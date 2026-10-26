import { getSignedInUser, googleSignInPath } from "../google-auth";
import { redirect } from "next/navigation";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { readRecord } from '../data-server';

export const dynamic = "force-dynamic";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>;
}) {
  if (await getSignedInUser()) redirect("/");
  const error = (await searchParams)?.auth_error;
  const site = await readRecord('site-settings-v1',{}).catch(()=>({}));
  const message = error === "not_configured"
    ? "Google sign-in is being configured by the administrator."
    : error ? "Google sign-in could not be completed. Please try again." : null;
  return (
    <main className="login-page">
      <a href="/" className="brand"><img className="brand-mark" src={site.logoUrl||"/logo.svg"} alt="Site logo" />{site.siteTitle||"Vocab Station"}</a>
      <div className="login-intro">
        <span className="eyebrow">YOUR PERSONAL VOCABULARY WORKSPACE</span>
        <h1>Welcome to<br />your next chapter.</h1>
        <p>Your profile, weekly tests and practice history are ready when you are.</p>
        {message && <p role="alert">{message}</p>}
      </div>
      <aside className="login-account-panel">
        <span className="eyebrow">YOUR ACCOUNT</span>
        <h2>Start learning with your account.</h2>
        <a className="primary login-cta" href={googleSignInPath("/")}>
          <ShieldCheck size={19} />Continue with Google<ArrowRight size={19} />
        </a>
        <p className="muted">One Google account keeps your private progress and practice history together.</p>
      </aside>
    </main>
  );
}
