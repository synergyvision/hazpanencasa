import { Injectable } from "@angular/core";
import { AngularFirestore, DocumentReference } from "@angular/fire/firestore";

import { DataStore } from "src/app/shared/shell/data-store";
import {
  FormulaModel,
  IngredientPercentageModel,
} from "../models/formula.model";
import { Observable, of } from "rxjs";

@Injectable()
export class FormulaService {
  private formulaDataStore: DataStore<Array<FormulaModel>>;

  constructor(private afs: AngularFirestore) {}

  /*
    Formula Listing Page
  */
  public getFormulasDataSource(
    user_email: string
  ): Observable<Array<FormulaModel>> {
    return this.afs
      .collection<FormulaModel>("formulas", (ref) =>
        ref.where("useremail", "==", user_email)
      )
      .valueChanges({ idField: "id" });
  }

  public getFormulasStore(
    dataSource: Observable<Array<FormulaModel>>
  ): DataStore<Array<FormulaModel>> {
    // Use cache if available
    if (!this.formulaDataStore) {
      // Initialize the model specifying that it is a shell model
      const shellModel: Array<FormulaModel> = [
        new FormulaModel(),
        new FormulaModel(),
        new FormulaModel(),
        new FormulaModel(),
        new FormulaModel(),
        new FormulaModel(),
        new FormulaModel(),
        new FormulaModel(),
        new FormulaModel(),
        new FormulaModel(),
      ];

      this.formulaDataStore = new DataStore(shellModel);
      // Trigger the loading mechanism (with shell) in the dataStore
      this.formulaDataStore.load(dataSource);
    }
    return this.formulaDataStore;
  }

  //Filters
  public searchFormulasByHydration(
    lower: number,
    upper: number
  ): Observable<Array<FormulaModel>> {
    const filtered = [];
    let hydration: number;
    this.formulaDataStore.state.forEach((ingredient) => {
      ingredient.forEach((item) => {
        hydration = Number(this.calculateHydration(item.ingredients));
        if (hydration >= lower && hydration <= upper) {
          filtered.push(item);
        }
      });
    });
    return of(filtered);
  }

  public searchFormulasByCost(
    lower: number,
    upper: number,
    formulas: Observable<Array<FormulaModel>>
  ): Observable<Array<FormulaModel>> {
    const filtered = [];
    let bakers_percentage: number;
    let cost: number;
    formulas.forEach((formula) => {
      formula.forEach((item) => {
        bakers_percentage = Number(
          this.calculateBakersPercentage(
            item.units * item.unit_weight,
            item.ingredients
          )
        );
        cost =
          Number(this.calculateTotalCost(item.ingredients, bakers_percentage)) /
          item.units;
        if (
          (cost >= lower || lower == null) &&
          (cost <= upper || upper == null)
        ) {
          filtered.push(item);
        }
      });
    });
    return of(filtered);
  }

  public searchFormulasByShared(
    type: string,
    formulas: Observable<Array<FormulaModel>>
  ): Observable<Array<FormulaModel>> {
    const filtered = [];
    formulas.forEach((formula) => {
      formula.forEach((item) => {
        if (item.shared == (type == "shared")) {
          filtered.push(item);
        }
      });
    });
    return of(filtered);
  }

  /*
    Formula Management
  */
  public createFormula(formulaData: FormulaModel): Promise<DocumentReference> {
    return this.afs.collection("formulas").add({ ...formulaData });
  }

  public updateFormula(formulaData: FormulaModel): Promise<void> {
    return this.afs
      .collection("formulas")
      .doc(formulaData.id)
      .set({ ...formulaData });
  }

  public deleteFormula(formulaKey: string): Promise<void> {
    return this.afs.collection("formulas").doc(formulaKey).delete();
  }

  /*
  Formula calculations
  */
  public calculateBakersPercentage(
    total_weight: number,
    ingredients: Array<IngredientPercentageModel>
  ): string {
    let percentage: number = 0;
    ingredients.forEach((ingredientData) => {
      if (!ingredientData.ingredient.formula) {
        percentage = percentage + Number(ingredientData.percentage);
      }
    });
    return (total_weight / percentage).toFixed(2);
  }

  public calculateHydration(
    ingredients: Array<IngredientPercentageModel>
  ): string {
    let hydration: number = 0;
    ingredients.forEach((ingredientData) => {
      if (!ingredientData.ingredient.formula) {
        hydration =
          ingredientData.percentage * ingredientData.ingredient.hydration +
          hydration;
      }
    });
    return (hydration / 100).toFixed(1);
  }

  public calculateTotalCost(
    ingredients: Array<IngredientPercentageModel>,
    bakers_percentage: number
  ): string {
    let cost: number = 0;
    ingredients.forEach((ingredientData) => {
      if (!ingredientData.ingredient.formula) {
        cost =
          ingredientData.percentage *
            bakers_percentage *
            ingredientData.ingredient.cost +
          cost;
      }
    });
    return cost.toFixed(2);
  }

  public fromRecipeToFormula(ingredients: Array<IngredientPercentageModel>) {
    let bakers_percentage = this.totalFlour(ingredients) / 100;
    ingredients.forEach((ingredient) => {
      if (!ingredient.ingredient.formula) {
        ingredient.percentage = Number(
          (ingredient.percentage / Number(bakers_percentage)).toFixed(1)
        );
      }
    });
    return ingredients;
  }

  public totalFlour(ingredients: Array<IngredientPercentageModel>) {
    let flour = 0;
    ingredients.forEach((ingredient) => {
      if (ingredient.ingredient.is_flour) {
        flour = flour + ingredient.percentage;
      }
    });
    return flour;
  }

  public getProportionFactor(
    weight: number,
    bakers_percentage: number,
    item: IngredientPercentageModel
  ): number {
    if (item.ingredient.formula.proportion_factor == "dough") {
      return (item.percentage / 100) * Number(weight);
    } else {
      return (item.percentage / 100) * Number(bakers_percentage) * 100;
    }
  }

  public getIngredientsCalculatedPercentages(
    formula_weight: number,
    original_bakers_percentage: number,
    ingredients: Array<IngredientPercentageModel>,
    ingredients_formula: Array<any>
  ) {
    let bakers_percentage: string;
    let proportion_factor: number;
    ingredients_formula.forEach((item) => {
      // Get bakers percentage from certain factor
      proportion_factor = this.getProportionFactor(
        formula_weight,
        original_bakers_percentage,
        item
      );
      bakers_percentage = this.calculateBakersPercentage(
        proportion_factor,
        item.ingredient.formula.ingredients
      );
      item.bakers_percentage = bakers_percentage;

      //Gets new values of ingredients

      ingredients.forEach((ingredient) => {
        if (!ingredient.ingredient.formula) {
          item.ingredient.formula.ingredients.forEach((ingredientFormula) => {
            if (ingredient.ingredient.id == ingredientFormula.ingredient.id) {
              ingredient.percentage =
                ingredient.percentage -
                ingredientFormula.percentage * Number(bakers_percentage);
            }
          });
        }
      });
    });
  }

  public getIngredientsWithFormulaCalculatedPercentages(
    formula_weight: number,
    original_bakers_percentage: number,
    ingredients: Array<IngredientPercentageModel>,
    ingredients_formula: Array<IngredientPercentageModel>
  ) {
    //Gets new total flour of formula
    let total_flour = this.totalFlour(ingredients);

    ingredients_formula.forEach((item) => {
      ingredients.forEach((ingredient) => {
        if (item.ingredient.id == ingredient.ingredient.id) {
          if (item.ingredient.formula.proportion_factor == "dough") {
            ingredient.percentage = Number(
              (
                (ingredient.percentage / 100) *
                Number(formula_weight) *
                (100 / total_flour)
              ).toFixed(2)
            );
          } else {
            ingredient.percentage = Number(
              (
                ingredient.percentage *
                Number(original_bakers_percentage) *
                (100 / total_flour)
              ).toFixed(2)
            );
          }
        }
      });
    });
  }
}
