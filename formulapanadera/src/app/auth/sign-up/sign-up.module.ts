import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Routes, RouterModule } from "@angular/router";

import { IonicModule } from "@ionic/angular";
import { SignUpPage } from "./sign-up.page";
import { ComponentsModule } from "../../components/components.module";
import { LanguageService } from "src/app/utils/language/language.service";
import { TranslateModule } from "@ngx-translate/core";

const routes: Routes = [
  {
    path: "",
    component: SignUpPage,
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
  declarations: [SignUpPage],
  providers: [LanguageService],
})
export class SignUpPageModule {}