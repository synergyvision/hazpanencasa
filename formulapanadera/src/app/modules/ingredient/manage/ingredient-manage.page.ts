import { Component, OnInit } from "@angular/core";
import {
  ModalController,
  IonRouterOutlet,
  LoadingController,
  ToastController,
} from "@ionic/angular";
import { Validators, FormGroup, FormControl } from "@angular/forms";

import { IngredientModel } from "../../../core/models/ingredient.model";
import { IngredientCRUDService } from "../../../core/services/firebase/ingredient.service";
import { ActivatedRoute, Router } from "@angular/router";
import { LanguageService } from "src/app/core/services/language.service";
import { FormatNumberService } from "src/app/core/services/format-number.service";
import { IngredientPickerModal } from "src/app/shared/modal/ingredient/ingredient-picker.modal";
import { IngredientPercentageModel } from "src/app/core/models/formula.model";
import { IngredientMixingModal } from "src/app/shared/modal/mixing/ingredient-mixing.modal";
import { FormulaService } from "src/app/core/services/formula.service";
import { APP_URL, CURRENCY } from "src/app/config/configuration";
import { ICONS } from "src/app/config/icons";
import { UserStorageService } from "src/app/core/services/storage/user.service";
import { UserResumeModel } from "src/app/core/models/user.model";
import { IngredientService } from "src/app/core/services/ingredient.service";
import { ReferenceModel } from "src/app/core/models/shared.model";
import { ReferencesModal } from "src/app/shared/modal/references/references.modal";

@Component({
  selector: "app-ingredient-manage",
  templateUrl: "./ingredient-manage.page.html",
  styleUrls: [
    "./../../../shared/styles/confirm.alert.scss",
    "./styles/ingredient-manage.page.scss",
  ],
})
export class IngredientManagePage implements OnInit {
  APP_URL = APP_URL;
  ICONS = ICONS;

  ingredient: IngredientModel = new IngredientModel();
  manageIngredientForm: FormGroup;
  update: boolean = false;
  current_user = new UserResumeModel();

  type: string = "simple";

  currency = CURRENCY;

  constructor(
    private ingredientCRUDService: IngredientCRUDService,
    private ingredientService: IngredientService,
    private userStorageService: UserStorageService,
    private formulaService: FormulaService,
    private languageService: LanguageService,
    private formatNumberService: FormatNumberService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private modalController: ModalController,
    private routerOutlet: IonRouterOutlet,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    this.route.queryParams.subscribe(async () => {
      this.ingredient = new IngredientModel();
      this.update = false;
      this.type = "simple";
      let state = this.router.getCurrentNavigation().extras.state;
      if (state == undefined) {
        delete this.ingredient.formula;
        this.manageIngredientForm = new FormGroup({
          name: new FormControl("", Validators.required),
          hydration: new FormControl("", Validators.required),
          is_flour: new FormControl(false, Validators.required),
          cost: new FormControl("0", Validators.required),
        });
        this.ingredient.user = {
          owner: this.current_user.email,
          can_clone: false,
          public: false,
          reference: "",
          shared_users: [],
          shared_references: [],
          creator: {
            name: this.current_user.name,
            email: this.current_user.email,
            date: new Date(),
          },
          modifiers: [],
        };
      } else {
        this.update = true;
        this.ingredient = JSON.parse(JSON.stringify(state.ingredient));
        if (this.ingredient.formula) {
          this.type = "compound";
        }
        this.ingredient.user = state.ingredient.user;
        this.manageIngredientForm = new FormGroup({
          name: new FormControl(state.ingredient.name, Validators.required),
          hydration: new FormControl(
            state.ingredient.hydration,
            Validators.required
          ),
          is_flour: new FormControl(
            state.ingredient.is_flour,
            Validators.required
          ),
          cost: new FormControl(state.ingredient.cost, Validators.required),
        });
        this.ingredient.references = []
        if (state.ingredient.references && state.ingredient.references.length > 0) {
          state.ingredient.references.forEach((reference) => {
            this.ingredient.references.push(JSON.parse(JSON.stringify(reference)));
          });
        }
      }
      let user = await this.userStorageService.getUser();
      this.current_user = { name: user.name, email: user.email };
    });
  }

  async pickIngredient() {
    let ingredients;
    if (this.ingredient.formula.ingredients) {
      ingredients = JSON.parse(JSON.stringify(this.ingredient.formula.ingredients));
    } else {
      ingredients = this.ingredient.formula.ingredients;
    }
    const modal = await this.modalController.create({
      component: IngredientPickerModal,
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
      componentProps: {
        selectedIngredients: ingredients,
      },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data !== undefined) {
      if (this.ingredient.formula.ingredients == null) {
        this.ingredient.formula.ingredients = [];
      }
      let new_ingredients: IngredientPercentageModel[] = []
      let deleted_ingredients: IngredientPercentageModel[] = []
      let exists: boolean
      this.ingredient.formula.ingredients.forEach(prev_ingredient => {
        exists = false
        data.ingredients.forEach((new_ingredient: IngredientPercentageModel) => {
          if (prev_ingredient.ingredient.id == new_ingredient.ingredient.id) {
            exists = true
          }
        })
        if (!exists) {
          deleted_ingredients.push(prev_ingredient)
        }
      })
      data.ingredients.forEach((new_ingredient: IngredientPercentageModel) => {
        exists = false
        this.ingredient.formula.ingredients.forEach(prev_ingredient => {
          if (prev_ingredient.ingredient.id == new_ingredient.ingredient.id) {
            exists = true
          }
        })
        if (!exists) {
          new_ingredients.push(new_ingredient)
        }
      })
      this.adjustMixing(new_ingredients, deleted_ingredients)
      this.ingredient.formula.ingredients = data.ingredients;
    }
  }

  async mixIngredients() {
    let mixedIngredients = [
      {
        ingredients: [],
        description: "",
      },
    ];
    if (!this.ingredient.formula.mixing || !this.ingredient.formula.mixing[0]) {
      this.ingredient.formula.ingredients.forEach(
        (ingredient: IngredientPercentageModel) =>
          mixedIngredients[0].ingredients.push(ingredient)
      );
    } else {
      mixedIngredients = this.ingredient.formula.mixing;
    }
    const modal = await this.modalController.create({
      component: IngredientMixingModal,
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
      componentProps: {
        formulaMixing: mixedIngredients,
        formula: false
      },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data !== undefined) {
      this.ingredient.formula.mixing = data.mixing;
    }
  }

  deleteSelectedIngredient(ingredient: IngredientPercentageModel) {
    this.ingredient.formula.ingredients.splice(
      this.ingredient.formula.ingredients.indexOf(ingredient),
      1
    );
    this.adjustMixing([], [ingredient])
  }

  canSend() {
    return (
      (!this.manageIngredientForm.valid && this.type == "simple") ||
      (this.ingredient.formula &&
        !(
          this.manageIngredientForm.value.name &&
          this.ingredient.formula.proportion_factor.factor &&
          this.ingredient.formula.ingredients &&
          this.ingredient.formula.ingredients.length>0 &&
          this.ingredientsAreValid()
        ))
    );
  }

  formatSuggestedValues(type: string, value: number) {
    if (type == "min") {
      this.ingredient.formula.suggested_values.min = Number(
        this.formatNumberService.formatNumberDecimals(value, 0)
      );
    } else {
      this.ingredient.formula.suggested_values.max = Number(
        this.formatNumberService.formatNumberDecimals(value, 0)
      );
    }
  }

  async addReferences() {
    let references: Array<ReferenceModel>;
    if (this.ingredient.references) {
      references = JSON.parse(JSON.stringify(this.ingredient.references))
    }
    const modal = await this.modalController.create({
      component: ReferencesModal,
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
      componentProps: {
        references: references
      },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data !== undefined) {
      this.ingredient.references = data;
    }
  }

  async sendIngredient() {
    const loading = await this.loadingController.create({
      cssClass: "app-send-loading",
      message: this.languageService.getTerm("loading"),
    });
    await loading.present();

    this.ingredient.name = this.manageIngredientForm.value.name;
    if (this.ingredient.references) {
      this.ingredient.references = JSON.parse(JSON.stringify(this.ingredient.references))
    }

    if (!this.ingredient.formula) {
      this.ingredient.hydration = this.manageIngredientForm.value.hydration;
      this.ingredient.is_flour = this.manageIngredientForm.value.is_flour;
      this.ingredient.cost = this.manageIngredientForm.value.cost;
    } else {
      this.ingredient.hydration = Number(
        this.formulaService.calculateHydration(
          this.ingredient.formula.ingredients
        )
      );
      this.ingredient.is_flour = false;
      this.ingredient.cost = null;
      if (!this.ingredient.formula.compensation_percentage) {
        this.ingredient.formula.compensation_percentage = 0;
      }
      if (!this.ingredient.formula.mixing || !this.ingredient.formula.mixing[0]) {
        this.ingredient.formula.mixing = null
      }
    }

    let ingredients = this.ingredientService.getIngredients();
    let ingredient_exists = false;
    if (ingredients) {
      ingredients.forEach((ingredient) => {
        if (ingredient.name == this.ingredient.name) {
          if (!this.ingredient.id || this.ingredient.id !== ingredient.id) {
            ingredient_exists = true;
          }
        }
      });
    }
    if (ingredient_exists) {
      loading.dismiss();
      this.presentToast(false, true);
    } else {
      if (!this.update) {
        this.ingredient.user = {
          owner: this.current_user.email,
          can_clone: this.ingredient.user.can_clone,
          public: this.ingredient.user.public,
          reference: "",
          shared_users: [],
          shared_references: [],
          creator: {
            name: this.current_user.name,
            email: this.current_user.email,
            date: new Date(),
          },
          modifiers: [],
        };
        this.ingredientCRUDService
          .createIngredient(this.ingredient)
          .then(() => {
            this.router.navigateByUrl(
              APP_URL.menu.name +
                "/" +
                APP_URL.menu.routes.ingredient.main +
                "/" +
                APP_URL.menu.routes.ingredient.routes.details,
              {
                state: { ingredient: JSON.parse(JSON.stringify(this.ingredient)) },
              }
            );
          })
          .catch(() => {
            this.presentToast(false);
          })
          .finally(async () => {
            await loading.dismiss();
          });
      } else {
        this.ingredient.user.modifiers.push({
          name: this.current_user.name,
          email: this.current_user.email,
          date: new Date(),
        });
        this.ingredientCRUDService
          .updateIngredient(this.ingredient)
          .then(() => {
            this.router.navigateByUrl(
              APP_URL.menu.name +
                "/" +
                APP_URL.menu.routes.ingredient.main +
                "/" +
                APP_URL.menu.routes.ingredient.routes.details,
              {
                state: { ingredient: JSON.parse(JSON.stringify(this.ingredient)) },
              }
            );
          })
          .catch(() => {
            this.presentToast(false);
          })
          .finally(async () => {
            await loading.dismiss();
          });
      }
    }
  }

  formatNumberPercentage(value: number) {
    if (this.manageIngredientForm.value.is_flour) {
      this.manageIngredientForm.get("hydration").patchValue("0.0");
    } else {
      this.manageIngredientForm
        .get("hydration")
        .patchValue(this.formatNumberService.formatNumberPercentage(value));
    }
  }

  formatPercentage() {
    if (this.ingredient.formula) {
      this.ingredient.formula.compensation_percentage = Number(
        this.formatNumberService.formatNumberPercentage(
          this.ingredient.formula.compensation_percentage
        )
      );
    }
  }

  formatDecimals(item: IngredientPercentageModel) {
    item.percentage = Number(
      this.formatNumberService.formatNumberDecimals(item.percentage)
    );
  }

  changeFlourIngredient() {
    if (this.manageIngredientForm.value.is_flour) {
      this.manageIngredientForm.get("hydration").patchValue("0.0");
    }
  }

  async pickProportionIngredient() {
    const modal = await this.modalController.create({
      component: IngredientPickerModal,
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
      componentProps: {
        selectedIngredients: undefined,
        limit: 1,
      },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data !== undefined) {
      this.ingredient.formula.proportion_factor.ingredient = {
        id: data.ingredients[0].ingredient.id,
        name: data.ingredients[0].ingredient.name,
      };
    }
  }

  async changeProportionFactor() {
    if (this.ingredient.formula.proportion_factor.factor == "ingredient") {
      await this.pickProportionIngredient();
    } else {
      this.ingredient.formula.proportion_factor.ingredient = null;
    }
  }

  changeType(ev: any) {
    this.type = ev.detail.value;
    if (this.type == "compound") {
      this.ingredient.formula = {
        ingredients: [],
        mixing: [],
        compensation_percentage: 0,
        proportion_factor: { factor: "dough" },
        suggested_values: {
          min: 0,
          max: 0,
        },
      };
    } else {
      delete this.ingredient.formula;
    }
  }

  ingredientsAreValid() {
    let valid = true;
    if (this.ingredient.formula.ingredients) {
      this.ingredient.formula.ingredients.forEach((ingredient) => {
        if (ingredient.percentage <= 0) {
          valid = false;
        }
      });
    }
    return valid;
  }

  async presentToast(success: boolean, exists: boolean = false) {
    const toast = await this.toastController.create({
      message: exists
        ? this.languageService.getTerm("send.exists")
        : success
        ? this.languageService.getTerm("send.success")
        : this.languageService.getTerm("send.error"),
      color: "secondary",
      duration: 5000,
      position: "top",
      buttons: [
        {
          icon: ICONS.close,
          role: "cancel",
          handler: () => {},
        },
      ],
    });
    toast.present();
  }

  adjustMixing(new_ingredients: IngredientPercentageModel[], deleted_ingredients: IngredientPercentageModel[]) {
    if (this.ingredient.formula.mixing && this.ingredient.formula.mixing[0]) {
      if (new_ingredients.length > 0) {
        new_ingredients.forEach(ingredient=>{
          this.ingredient.formula.mixing[0].ingredients.push(ingredient)
        })
      }
      if (deleted_ingredients.length > 0) {
        deleted_ingredients.forEach(ingredient=>{
          this.ingredient.formula.mixing.forEach((mix, mix_i) => {
            mix.ingredients.forEach((mix_ingredient, ingredient_i) => {
              if (mix_ingredient.ingredient.id == ingredient.ingredient.id) {
                this.ingredient.formula.mixing[mix_i].ingredients.splice(
                  ingredient_i,
                  1
                );
                if (this.ingredient.formula.mixing[mix_i].ingredients.length == 0) {
                  this.ingredient.formula.mixing.splice(mix_i,1)
                }
              }
            })
          })
        })
      }
    }
  }
}
