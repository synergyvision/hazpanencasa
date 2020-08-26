import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Routes, RouterModule } from "@angular/router";

import { IonicModule } from "@ionic/angular";
import { ForgotPasswordPage } from "./forgot-password.page";
import { ComponentsModule } from "../../components/components.module";
import { LanguageService } from "src/app/utils/language/language.service";
import { TranslateModule } from "@ngx-translate/core";

const routes: Routes = [
  {
    path: "",
    component: ForgotPasswordPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    ComponentsModule,
    TranslateModule,
  ],
  declarations: [ForgotPasswordPage],
  providers: [LanguageService],
})
export class ForgotPasswordPageModule {}
