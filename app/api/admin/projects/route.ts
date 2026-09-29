import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { createProject, getProjects } from "@/lib/projects";
import { getProjectStatuses } from "@/lib/project-statuses";
export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function GET(){await requireAdminSession();try{return NextResponse.json({projects:await getProjects()});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Could not load projects."},{status:500});}}
export async function POST(request:Request){await requireAdminSession();try{const body=(await request.json()) as Record<string,unknown>;const statuses=await getProjectStatuses();const project=await createProject(body,new Set(statuses.map(s=>s.id)));return NextResponse.json({project},{status:201});}catch(e){const message=e instanceof Error?e.message:"Could not create project.";return NextResponse.json({error:message},{status:message.includes("required")||message.includes("format")||message.includes("found")||message.includes("must")?400:500});}}