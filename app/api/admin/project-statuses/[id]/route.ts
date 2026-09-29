import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { deleteProjectStatus, updateProjectStatus } from "@/lib/project-statuses";
export const runtime="nodejs"; export const dynamic="force-dynamic";
type Context={params:Promise<{id:string}>};
export async function PUT(request:Request,context:Context){await requireAdminSession();try{const {id}=await context.params;const body=(await request.json()) as {name?:unknown};return NextResponse.json({status:await updateProjectStatus(id,body.name)});}catch(e){const message=e instanceof Error?e.message:"Could not update status.";return NextResponse.json({error:message},{status:400});}}
export async function DELETE(_request:Request,context:Context){await requireAdminSession();try{const {id}=await context.params;await deleteProjectStatus(id);return NextResponse.json({ok:true});}catch(e){const message=e instanceof Error?e.message:"Could not delete status.";return NextResponse.json({error:message},{status:400});}}