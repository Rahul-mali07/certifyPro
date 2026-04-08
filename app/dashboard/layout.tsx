import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { UserSidebar } from "@/components/user-sidebar"
import { Separator } from "@/components/ui/separator"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession()
  if (!user) {
    redirect("/login")
  }
  if (user.role === "admin") {
    redirect("/admin")
  }

  return (
    <SidebarProvider>
      <UserSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 !h-4" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Welcome,</span>
            <span className="text-sm font-medium text-foreground">{user.name}</span>
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
