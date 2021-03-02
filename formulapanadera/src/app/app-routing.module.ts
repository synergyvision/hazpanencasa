import { NgModule } from "@angular/core";
import { PreloadAllModules, RouterModule, Routes } from "@angular/router";
import { APP_URL, MAIN_PAGE } from "./config/configuration";
import { AuthGuard } from "./core/guards/auth.guard";
import { AuthModule } from "./modules/auth/auth.module";

const routes: Routes = [
  {
    path: "",
    redirectTo: MAIN_PAGE,
    pathMatch: "full",
  },
  {
    path: APP_URL.menu.name,
    canLoad: [AuthGuard],
    loadChildren: () =>
      import("./modules/tabs/tabs.module").then((m) => m.TabsPageModule),
  },
  {
    path: APP_URL.auth.name,
    loadChildren: () =>
      import("./modules/auth/auth.module").then((m) => m.AuthModule),
  },
  {
    path: 'tutorials',
    loadChildren: () => import('./modules/settings/tutorials/tutorials.module').then( m => m.TutorialsPageModule)
  },
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
    AuthModule,
  ],
  exports: [RouterModule],
  providers: [AuthGuard],
})
export class AppRoutingModule {}
