import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { createProjectStatus, getProjectStatuses } from "@/lib/project-statuses";
export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function GET(){await requireAdminSession();try{return NextResponse.json({statuses:await getProjectStatuses()});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Could not load statuses."},{status:500});}}
export async function POST(request:Request){await requireAdminSession();try{const body=(await request.json()) as {name?:unknown};return NextResponse.json({status:await createProjectStatus(body.name)},{status:201});}catch(e){const message=e instanceof Error?e.message:"Could not create status.";return NextResponse.json({error:message},{status:message.includes("required")||message.includes("exists")?400:500});}}