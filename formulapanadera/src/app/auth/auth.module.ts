import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Routes, RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { ComponentsModule } from "../components/components.module";
import { AngularFireAuthModule } from "@angular/fire/auth";
import { AngularFireModule } from "@angular/fire";
import { environment } from "../../environments/environment";
import { AuthService } from "./auth.service";

const routes: Routes = [
  {
    path: "sign-up",
    loadChildren: () =>
      import("./sign-up/sign-up.module").then((m) => m.SignUpPageModule),
  },
  {
    path: "sign-in",
    loadChildren: () =>
      import("./sign-in/sign-in.module").then((m) => m.SignInPageModule),
  },
  {
    path: "forgot-password",
    loadChildren: () =>
      import("./forgot-password/forgot-password.module").then(
        (m) => m.ForgotPasswordPageModule
      ),
  },
];

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    ComponentsModule,
    RouterModule.forChild(routes),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
  ],
  providers: [AuthService],
})
export class AuthModule {}
