import { Component, OnInit } from "@angular/core";
import { BUTTON_TEXTS ,TOASTER_MESSAGES} from "src/app/shared/utils/constant";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { NgbDate, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ViewTemplateHistoryDialogComponent } from "./view-template-history-dialog.component";
import { ReferenceService } from "src/app/shared/services/reference.service";
import { UserService } from 'src/app/shared/services/user.service';
import { ToasterService } from "src/app/shared/services/toaster.service";


@Component({
  selector: "app-launch-dashboard",
  templateUrl: "./launch-dashboard.component.html",
  styleUrls: ["./launch-dashboard.component.scss"],
})
export class LaunchDashboardComponent implements OnInit {
  activateButtonText = BUTTON_TEXTS.ACTIVATE_BUTTON_TEXT;
  deactivateButtonText = BUTTON_TEXTS.DEACTIVATE_BUTTON_TEXT;
  viewButtonText = BUTTON_TEXTS.VIEW_BUTTON_TEXT;

  form: FormGroup;
  templates = [];
  loading:boolean = false;
  isFilterValid : boolean = false;

  checkerLogin = "Launch Dashboard";

  //Pagination properties
  currentPage = 1;
  pageSize = 10;
  collectionSize : number;

  tableHeaders = [
    "Template Id",
    "Created On",
    "Upload Time",
    "Campaign End Date",
    "Action",
    "Audit",
  ];

  //filterOptions = ["All", "Active", "Inactive"];

  filterOptions = [
    { name : "ALL" , value : "0"},
    { name : "Active",value : "1"},
    {name : "Inactive" , value : "2"}
  ];


  today = new Date();

  fromMinDate: any;
  fromMaxDate: any;
  toMinDate: any;
  toMaxDate: any;

  constructor(
    private formBuilder: FormBuilder,
    private referenceService: ReferenceService,
    private ngbModal: NgbModal,
    private userService: UserService,
    private toasterService: ToasterService) {
    this.form = this.formBuilder.group({
      fromDate: [null, Validators.required],
      toDate: [null, Validators.required],
      filterType: [this.filterOptions[0].value, Validators.required],
    });
    this.setValidators();
  }

  ngOnInit(): void {
    this.setValidators();
    this.fetchLauchDashBoardTemplate();
    // this.templates = [
    //   {
    //     templateId: "T00000002",
    //     createdOn: "26/06/2020, 12:00PM",
    //     uploadTime: "3:00PM",
    //     launchId: "Launch0002",
    //     campaignEndDate: "26/07/2020, 12:00PM",
    //     status: "Active",
    //   },
    //   {
    //     templateId: "T00000003",
    //     createdOn: "26/06/2020, 12:00PM",
    //     uploadTime: "4:00PM",
    //     launchId: "Launch0003",
    //     campaignEndDate: "26/07/2020, 12:00PM",
    //     status: "Inactive",
    //   },
    // ];
  }
  setValidators(): void {
    const {
      minDate,
      maxDate,
    } = this.referenceService.getDefaultDateValidators();

    this.fromMinDate = minDate;
    this.fromMaxDate = maxDate;

    this.toMinDate = minDate;
    this.toMaxDate = maxDate;
  }

  onFromDateChange(event: NgbDate): void {
    const { year, month, day } = event;
    this.toMinDate = { year, month, day };
    this.validate();

  }

  onToDateChange(event: NgbDate): void {
    const { year, month, day } = event;
    this.fromMaxDate = { year, month, day };
    this.validate();

  }


  onPageChanged(currentPage: number) {
    this.currentPage = currentPage;
    if (this.isFilterValid) {
      this.fetchFilteredLauchDashBoardTemplates();
    } else {
      this.fetchLauchDashBoardTemplate();
    }
  }

  onFilterTypeChange(event: any) {
    this.validate();
  }

  openTemplateHistoryDialog(): void {
    this.ngbModal.open(ViewTemplateHistoryDialogComponent, { centered: true });
  }

  validate()
  {
    if(this.form.valid)
    {
      this.isFilterValid = true;
      this.fetchFilteredLauchDashBoardTemplates();
    }
    else{
      this.isFilterValid = false;
    }
  }

  fetchFilteredLauchDashBoardTemplates()
  {
    this.templates = null;
    window.scroll(0,0);
    this.loading = true;
    const feildControls = this.form.controls;
    const fromDate = feildControls.fromDate.value;
    const toDate = feildControls.toDate.value;

    const formattedFromDate = `${fromDate.year}-${fromDate.month}-${fromDate.day}`;
    const formattedToDate = `${toDate.year}-${toDate.month}-${toDate.day}`;
    const filterType = feildControls.filterType.value;
    const isActiveStatus = filterType === "0" ? "" : filterType;

    this.userService.fetchCheckerScreenTemplates(this.currentPage,formattedFromDate,formattedToDate,"",this.checkerLogin,isActiveStatus)
    .subscribe((fetchedTemplates) =>{
      const {
        ProcessVariables: { status },
        ProcessVariables: { message = {} },
      } = fetchedTemplates;
      if (status)
      {
        this.templates = fetchedTemplates.ProcessVariables.templateList;
        this.collectionSize = fetchedTemplates.ProcessVariables.totalCount;
        this.loading = false;
      }
      else{
        this.loading = false;
        this.toasterService.showError(message.value);
      }
    },
    (error) =>
    {
      this.loading = false;
      this.toasterService.showError(error);
    }
    );
  }

  fetchLauchDashBoardTemplate()
  {
    this.templates = null;
    window.scroll(0,0);
    this.loading = true;
    this.userService.fetchCheckerScreenTemplates(this.currentPage,"","","",this.checkerLogin,"").subscribe(
      (fetchedTemplates) =>{
          const {
            ProcessVariables : {status},
            ProcessVariables : { message ={} },
          } = fetchedTemplates;
          if(status)
          {
            this.templates = fetchedTemplates.ProcessVariables.templateList;
            this.collectionSize = fetchedTemplates.ProcessVariables.totalCount
            this.loading = false;
          }
          else{
            this.loading = false;
            this.toasterService.showError(message.value);
          }
      },
      (error) => {
        this.loading = false;
        this.toasterService.showError(error);
      }
    );
  }

  deActivateTemplate(template : any)
  {
    let templateId = template.id;
    this.userService.deactivateTemplate(templateId).subscribe((result) =>{
      const {
        ProcessVariables: { status },
        ProcessVariables: {message = {}},
      } = result;

      if(status)
      {
      this.toasterService.showSuccess(TOASTER_MESSAGES.DEACTIVATE_USER_SUCCESS);
      if(this.isFilterValid)
      {
        this.fetchFilteredLauchDashBoardTemplates();
      }
      else{
        this.fetchLauchDashBoardTemplate();
      }
      }
      else{
        this.toasterService.showError(message.value)
      }
      console.log(result);
    },
    (error) => {
      this.toasterService.showError(error);
    });

  }

  activateTemplate(template : any)
  {
    let templateId = template.id;
    this.userService.activateTemplate(templateId).subscribe((result) => {
      const {
        ProcessVariables: { status },
        ProcessVariables: {message = {}},
      } = result;
      if(status)
      {
        this.toasterService.showSuccess(TOASTER_MESSAGES.ACTIVATE_USER_SUCCESS);
        if(this.isFilterValid)
        {
          this.fetchFilteredLauchDashBoardTemplates();
        }
        else{
          this.fetchLauchDashBoardTemplate();
        }
      }
      else{
        this.toasterService.showError(message.value);
      }
    },
    (error) =>{
      this.toasterService.showError(error);
    });

 
  }
  

}
