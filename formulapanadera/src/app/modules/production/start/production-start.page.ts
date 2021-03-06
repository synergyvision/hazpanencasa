import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AlertController } from "@ionic/angular";
import { APP_URL } from "src/app/config/configuration";
import { OVEN_STEP } from 'src/app/config/formula';
import { ICONS } from "src/app/config/icons";
import {
  FormulaPresentModel,
  ProductionInProcessModel,
  ProductionModel,
  ProductionStepModel,
  TimeModel,
} from "src/app/core/models/production.model";
import { LanguageService } from "src/app/core/services/language.service";
import { ProductionInProcessService } from "src/app/core/services/production-in-process.service";
import { ProductionInProcessStorageService } from "src/app/core/services/storage/production-in-process.service";
import { TimeService } from "src/app/core/services/time.service";

@Component({
  selector: "app-production-start",
  templateUrl: "production-start.page.html",
  styleUrls: [
    "./styles/production-start.page.scss",
    "./../../../shared/styles/confirm.alert.scss",
  ],
})
export class ProductionStartPage implements OnInit {
  ICONS = ICONS;

  production: ProductionModel = new ProductionModel();
  production_in_process: ProductionInProcessModel = new ProductionInProcessModel();
  original_production: ProductionInProcessModel = new ProductionInProcessModel();
  formulas: Array<FormulaPresentModel & { show: boolean }> = [];
  in_process: boolean = false;

  specify_time: boolean = false;
  laboral_time: TimeModel = new TimeModel();

  state;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private productionInProcessService: ProductionInProcessService,
    private productionInProcessStorageService: ProductionInProcessStorageService,
    private timeService: TimeService,
    private alertController: AlertController,
    private languageService: LanguageService
  ){}

  async ngOnInit() {
    this.route.queryParams.subscribe(async () => {
      this.state = this.router.getCurrentNavigation().extras.state;
      this.production = JSON.parse(JSON.stringify(this.state.production));
      let existing_production = await this.productionInProcessStorageService.getProduction();
      this.production_in_process = new ProductionInProcessModel();
      this.original_production = new ProductionInProcessModel();
      this.formulas = [];
      this.in_process = false;
      this.specify_time = false;
      this.laboral_time = new TimeModel();

      if (
        existing_production &&
        existing_production.production.id == this.production.id
      ) {
        this.production = existing_production.production;
        this.formulas = existing_production.formulas;
        this.productionInProcessService.setProductionInProcess(
          existing_production.production_in_process
        );
        this.in_process = true;
      } else {
        this.formulas = JSON.parse(JSON.stringify(this.state.formulas));
        this.original_production = this.productionInProcessService.getProductionSteps(
          this.production
        );
      }

      this.productionInProcessService
        .getProductionInProcess()
        .subscribe((value) => {
          this.production_in_process = value;
          if (this.in_process) {
            this.productionInProcessStorageService.setProduction({
              formulas: this.formulas,
              production: this.production,
              production_in_process: value,
            });
          }
          if (
            this.productionInProcessService.productionEnded(
              this.production_in_process.steps
            )
          ) {
            this.changeProcessStatus();
          }
        });
    });
  }

  // Change

  async changeProcessStatus() {
    this.in_process = !this.in_process;

    if (this.in_process) {
      this.productionInProcessService.orderProduction(
        this.production_in_process
      );
      if (this.specify_time) {
        this.verifyLaboralTime();
      }
    } else {
      this.original_production = this.productionInProcessService.getProductionSteps(
        this.production
      );
      await this.productionInProcessStorageService.deleteProduction();
    }
  }

  laboralTimeChanged(ev: any, type: string) {
    if (type == "start") {
      this.laboral_time.start = ev.detail.value;
    } else {
      this.laboral_time.end = ev.detail.value;
    }
  }

  verifyLaboralTime() {
    let invalid_steps = this.productionInProcessService.verifyLaboralTime(
      this.production_in_process,
      this.laboral_time
    );
    if (invalid_steps.length > 0) {
      this.invalidStepsAlert(invalid_steps);
    }
  }

  // Get / Format

  currentTime(): string {
    return this.timeService.getCurrentTime();
  }

  productionStartTime(): string {
    return this.timeService.formatTime(this.production_in_process.time.start);
  }

  productionEndTime(): string {
    return this.timeService.formatTime(this.production_in_process.time.end);
  }

  stepsFiltered(done: boolean): Array<ProductionStepModel> {
    let filtered: Array<ProductionStepModel> = [];
    if (this.production_in_process.steps) {
      this.production_in_process.steps.forEach((step) => {
        if (step.step.time !== 0) {
          if (done && step.status == "DONE") {
            filtered.push(step);
          } else if (!done && step.status != "DONE") {
            filtered.push(step);
          }
        }
      });
    }
    return filtered;
  }

  stepBlocked(step: ProductionStepModel): boolean {
    if (step.step.number !== (OVEN_STEP - 1.5)) {
      return this.productionInProcessService.stepIsBlocked(
        this.production_in_process,
        step
      );
    } else {
      return false
    }
  }

  stepDay(step: ProductionStepModel) {
    let day: number = this.timeService.getDay(step.time.start)
    return this.languageService.getTerm(`day.${day}`)
  }

  dayChanged(step: ProductionStepModel, index: number): boolean {
    if (index > 0) {
      return this.stepDay(this.stepsFiltered(false)[index - 1]) !== this.stepDay(step)
    } else {
      return true
    }
  }

  getStepFormula(step: ProductionStepModel): FormulaPresentModel & { show: boolean } {
    let step_formula: FormulaPresentModel & { show: boolean };
    this.formulas.forEach(formula => {
      if (step.formula.id == formula.formula.id) {
        step_formula = formula;
      }
    })
    return step_formula
  }

  // Navigate

  productionDetails() {
    this.router.navigateByUrl(
      APP_URL.menu.name +
        "/" +
        APP_URL.menu.routes.production.main +
        "/" +
        APP_URL.menu.routes.production.routes.details,
      {
        state: { production: JSON.parse(JSON.stringify(this.production)) },
      }
    );
  }

  // Alerts
  async invalidStepsAlert(steps: Array<ProductionStepModel>) {
    let invalid_steps = "";
    steps.forEach((step) => {
      invalid_steps =
        invalid_steps +
        `<br/>${step.formula.name}<br/>${
          step.step.name
        }<br/>${this.timeService.formatTime(
          step.time.start
        )} - ${this.timeService.formatTime(step.time.end)}<br/>`;
    });
    let text = `${this.languageService.getTerm(
      "production.invalid_steps.text"
    )}<br/>${invalid_steps}`;

    const alert = await this.alertController.create({
      header: this.languageService.getTerm("production.invalid_steps.name"),
      message: text,
      cssClass: "confirm-alert",
      buttons: [
        {
          text: this.languageService.getTerm("action.cancel"),
          role: "cancel",
          handler: () => {
            this.changeProcessStatus();
          },
        },
        {
          text: this.languageService.getTerm("action.ok"),
          cssClass: "confirm-alert-accept",
          handler: () => {},
        },
      ],
    });
    await alert.present();
  }

  async startOrStopProduction() {
    if (this.in_process) {
      const alert = await this.alertController.create({
        header: this.languageService.getTerm("production.warning.name"),
        message: this.languageService.getTerm("production.warning.stop"),
        cssClass: "confirm-alert",
        buttons: [
          {
            text: this.languageService.getTerm("action.cancel"),
            role: "cancel",
            handler: () => { },
          },
          {
            text: this.languageService.getTerm("action.ok"),
            cssClass: "confirm-alert-accept",
            handler: () => {
              this.changeProcessStatus();
            },
          },
        ],
      });
      await alert.present();
    } else {
      this.changeProcessStatus()
    }
  }
}
