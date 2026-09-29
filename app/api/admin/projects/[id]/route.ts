import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { deleteProject, updateProject } from "@/lib/projects";
import { getProjectStatuses } from "@/lib/project-statuses";
export const runtime="nodejs"; export const dynamic="force-dynamic";
type Context={params:Promise<{id:string}>};
export async function PUT(request:Request,context:Context){await requireAdminSession();try{const {id}=await context.params;const body=(await request.json()) as Record<string,unknown>;const statuses=await getProjectStatuses();return NextResponse.json({project:await updateProject(id,body,new Set(statuses.map(s=>s.id)))});}catch(e){const message=e instanceof Error?e.message:"Could not update project.";return NextResponse.json({error:message},{status:400});}}
export async function DELETE(_request:Request,context:Context){await requireAdminSession();try{const {id}=await context.params;await deleteProject(id);return NextResponse.json({ok:true});}catch(e){const message=e instanceof Error?e.message:"Could not delete project.";return NextResponse.json({error:message},{status:400});}}