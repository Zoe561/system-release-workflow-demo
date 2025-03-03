// welcome.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import * as saveAs from 'file-saver';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import * as dayjs from 'dayjs';

interface Department {
  value: string;
  label: string;
}

interface Division {
  value: string;
  label: string;
}

interface DepartmentDivisions {
  [key: string]: Division[];
}

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WelcomeComponent implements OnInit, OnDestroy {
  readonly baseFilePath = `Y:\\共享資料\\換版文件\\${dayjs().format('YYYY')}\\`;
  private readonly destroy$ = new Subject<void>();

  form!: FormGroup;

  readonly departmentDivisions: DepartmentDivisions = {
    '經紀系統部': [
      { value: '核心系統科', label: '核心系統科' },
      { value: '跨境業務科', label: '跨境業務科' },
      { value: '電子交易科', label: '電子交易科' }
    ],
    '支援系統部': [
      { value: '核心支援科', label: '核心支援科' },
      { value: '投資業務科', label: '投資業務科' },
      { value: '業務支援科', label: '業務支援科' },
    ],
    '資訊營管部': [
      { value: '系統管理科', label: '系統管理科' },
      { value: '資訊管理科', label: '資訊管理科' }
    ],
    '法人系統部': [
      { value: '交易管理科', label: '交易管理科' },
      { value: '系統開發科', label: '系統開發科' }
    ]
  };

  departments: Department[] = Object.keys(this.departmentDivisions).map(dept => ({
    value: dept,
    label: dept
  }));

  divisions: Division[] = [];

  get requestNumbers(): FormArray {
    return this.form.get('requestNumbers') as FormArray;
  }

  constructor(private readonly fb: FormBuilder) { }

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      riskLevel: ['', [Validators.required]],
      type: ['', [Validators.required]],
      versionType: ['', [Validators.required]],
      changeNumber: [''],
      systemName: ['', [Validators.required]],
      scheduledTime: this.fb.group({
        date: [null, [Validators.required]],
        time: [null, [Validators.required]]
      }),
      primarySystemCode: ['', [Validators.required]],
      secondarySystemCode: [''],
      changeSubject: ['', [Validators.required]],
      versionTypes: this.fb.group({
        normalVersion: [false],
        newSystem: [false],
        majorChange: [false],
        databaseChange: [false]
      }, { validators: this.atLeastOneChecked() }),
      requestNumbers: this.fb.array(
        [this.fb.control('', Validators.required)],
        [Validators.required, this.atLeastOneValue] // 添加自定義驗證器
      ),
      deliverables: this.fb.group({
        requirementSpec: [false],
        feasibilityReport: [false],
        sourceCodeReport: [false],
        securityCheckForm: [false],
        systemChangeNotice: [false],
        programFunction: [false],
        versionNotice: [false],
        integrationTest: [false],
        userTest: [false],
        codeComparison: [false],
        versionLogs: [false],
        mandatoryTestList: [false],
        sourceInspection: [false]
      }),
      others: [''],
      department: ['', [Validators.required]],
      division: ['', [Validators.required]],
      filePath: ['', [Validators.required]],
      affectedSystems: ['', [Validators.required]],
      impactAreas: ['', [Validators.required]],
      applicant: this.fb.group({
        employeeId: ['', [Validators.required]],
        extension: ['', [Validators.required]]
      })
    });
  }

  private setupFormSubscriptions(): void {
    this.form.get('department')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged()
    ).subscribe(this.updateDivisions.bind(this));

    this.form.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged((prev, curr) => {
        return prev.department === curr.department &&
          prev.division === curr.division &&
          prev.filePath === curr.filePath;
      })
    ).subscribe(() => {
      this.updateFilePath();
    });
  }

  // 自定義驗證器：檢查是否至少有一個非空值
  atLeastOneValue(control: AbstractControl): ValidationErrors | null {
    const array = control as FormArray;
    return array.controls.some(control => control.value?.trim())
      ? null
      : { atLeastOne: true };
  }

  atLeastOneChecked(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const controls = (formGroup as FormGroup).controls;
      
      const hasChecked = Object.keys(controls).some(key => controls[key].value === true);
      
      return hasChecked ? null : { atLeastOneRequired: true };
    };
  }

  
  private updateDivisions(department: string): void {
    this.divisions = this.departmentDivisions[department] || [];
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  getNestedControl(path: string[]): AbstractControl | null {
    return this.form.get(path);
  }

  onDateChange(date: Date): void {
    if (!date) return;

    const timeControl = this.form.get('scheduledTime.time');
    const currentTime = timeControl?.value;

    if (currentTime) {
      const newDateTime = new Date(date);
      newDateTime.setHours(currentTime.getHours());
      newDateTime.setMinutes(currentTime.getMinutes());

      timeControl?.patchValue(newDateTime, { emitEvent: false });
    }
  }



  updateFilePath(): void {
    const department = this.form.get('department')?.value;
    const division = this.form.get('division')?.value;
    const filePath = this.form.get('filePath')?.value;

    if (department && division && filePath) {
      const fullPath = `${this.baseFilePath}${department}/${division}/${filePath}`;
      this.form.get('filePath')?.setValue(filePath, { emitEvent: false });
    }
  }

  addRequestNumber(): void {
    this.requestNumbers.push(this.fb.control(''));
  }

  removeRequestNumber(index: number): void {
    this.requestNumbers.removeAt(index);
  }

  get f() {
    return this.form.controls;
  }

  async generateDoc(): Promise<void> {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      return;
    }

    try {
      const docData = await this.prepareDocData();
      const doc = await this.createDocument(docData);
      await this.saveDocument(doc);
    } catch (error) {
      console.error('Error generating document:', error);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {

    Object.values(formGroup.controls).forEach(control => {
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
      control.markAsDirty();
      control.markAsTouched();
      control.updateValueAndValidity();
      // console.log(control.hasError);
    });
  }

  private async prepareDocData(): Promise<any> {
    const formValue = this.form.value;
    const { date: dateObj, time: timeObj } = formValue.scheduledTime;

    return {
      ...this.prepareCheckboxData(formValue),
      ...this.prepareTimeData(dateObj, timeObj),
      systemName: formValue.systemName,
      primarySystemCode: formValue.primarySystemCode,
      secondarySystemCode: formValue.secondarySystemCode,
      changeSubject: formValue.changeSubject,
      requestNumbers: formValue.requestNumbers.join(', '),
      others: formValue.others,
      filePath: `${this.baseFilePath}${formValue.department}/${formValue.division}/${formValue.filePath}`,
      affectedSystems: formValue.affectedSystems,
      impactAreas: formValue.impactAreas,
      employeeId: formValue.applicant.employeeId,
      extension: formValue.applicant.extension
    };
  }

  private prepareCheckboxData(formValue: any): any {
    return {
      riskLevelHigh: formValue.riskLevel === 'high' ? '■' : '□',
      riskLevelMedium: formValue.riskLevel === 'medium' ? '■' : '□',
      riskLevelLow: formValue.riskLevel === 'low' ? '■' : '□',
      typeSelf: formValue.type === 'self' ? '■' : '□',
      typeOutsource: formValue.type === 'outsource' ? '■' : '□',
      versionTypeRegular: formValue.versionType === 'regular' ? '■' : '□',
      versionTypeNonRegular: formValue.versionType === 'nonRegular' ? '■' : '□',
      versionTypeEmergency: formValue.versionType === 'emergency' ? '■' : '□',
      changeNumber: formValue.changeNumber,
      ...Object.entries(formValue.versionTypes).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: value ? '■' : '□'
      }), {}),
      ...Object.entries(formValue.deliverables).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: value ? '■' : '□'
      }), {})
    };
  }

  private prepareTimeData(dateObj: Date, timeObj: Date): any {
    return {
      year: dateObj ? dateObj.getFullYear() : '',
      month: dateObj ? String(dateObj.getMonth() + 1).padStart(2, '0') : '',
      day: dateObj ? String(dateObj.getDate()).padStart(2, '0') : '',
      hour: timeObj ? String(timeObj.getHours()).padStart(2, '0') : '',
      minute: timeObj ? String(timeObj.getMinutes()).padStart(2, '0') : ''
    };
  }

  private async createDocument(data: any): Promise<any> {
    const response = await fetch('assets/系統換版申請單(online_ver).docx');
    const templateContent = await response.arrayBuffer();
    const zip = new PizZip(new Uint8Array(templateContent));
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    });

    doc.setData(data);
    doc.render();
    return doc;
  }

  private saveDocument(doc: any): void {
    const out = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    const formValue = this.form.value;
    const { date: dateObj, time: timeObj } = formValue.scheduledTime;
    const timeData = this.prepareTimeData(dateObj, timeObj);
    const fileName = `0 - 系統換版申請單_${timeData.year}${timeData.month}${timeData.day}${timeData.hour}${timeData.minute}.docx`;

    saveAs(out, fileName);
  }

  loadDemoData(): void {
    const demoData = {
      riskLevel: 'low',
      type: 'self',
      versionType: 'regular',
      changeNumber: '',
      systemName: '換版文件線上平台',
      scheduledTime: {
        date: new Date('2025-01-20'),
        time: new Date('2025-02-20T14:30:00+08:00')
      },
      primarySystemCode: 'TEST',
      secondarySystemCode: '00',
      changeSubject: '優化換版流程',
      versionTypes: {
        normalVersion: true,
        newSystem: false,
        majorChange: false,
        databaseChange: false
      },
      requestNumbers: ['TEST202402001', 'TEST202402002'],
      deliverables: {
        requirementSpec: false,
        feasibilityReport: false,
        sourceCodeReport: false,
        securityCheckForm: false,
        systemChangeNotice: true,
        programFunction: true,
        versionNotice: true,
        integrationTest: true,
        userTest: true,
        codeComparison: true,
        versionLogs: false,
        mandatoryTestList: true,
        sourceInspection: true
      },
      others: '系統效能報告、資料庫最佳化評估報告',
      department: '經紀系統部',
      division: '跨境業務科',
      filePath: 'TEST\\20250120',
      affectedSystems: '無影響',
      impactAreas: '效能相關',
      applicant: {
        employeeId: '012797',
        extension: '1234'
      }
    };

    this.loadDemoValues(demoData);
  }

  private loadDemoValues(demoData: any): void {
    while (this.requestNumbers.length) {
      this.requestNumbers.removeAt(0);
    }
    demoData.requestNumbers.forEach((number: string) => {
      this.requestNumbers.push(this.fb.control(number));
    });

    this.form.patchValue({ department: demoData.department });

    const { department, ...restData } = demoData;
    this.form.patchValue(restData);
  }
}