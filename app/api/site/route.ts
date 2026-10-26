import { readRecord } from "../../data-server";
export async function GET(){
 try {
  const settings=await readRecord('site-settings-v1',{});
  return Response.json({settings},{headers:{"Cache-Control":"public, max-age=60"}});
 } catch {return Response.json({settings:{}},{headers:{"Cache-Control":"no-store"}});}
}
