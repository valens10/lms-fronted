import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LeaveBalanceService } from '../../services/leave-balance.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-leave-request-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <div class="fixed inset-0 bg-black bg-opacity-50"></div>
      <div class="flex min-h-screen items-center justify-center p-4">
        <div class="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          <div class="p-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Request Leave</h2>
            <div class="text-sm text-gray-600 mb-4">
              Today: {{ minDate }}
            </div>
            <form [formGroup]="leaveForm" (ngSubmit)="onSubmit()" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                  <select 
                    formControlName="leaveTypeId"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required>
                    <option value="">Select Leave Type</option>
                    <option *ngFor="let type of leaveTypes" [value]="type.id">
                      {{ type.name }}
                    </option>
                  </select>
                  <div *ngIf="selectedLeaveType?.isAnnualLeave" class="text-sm text-gray-600 mt-1">
                    Available days: {{ availableAnnualLeave }}
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input 
                    type="date"
                    formControlName="startDate"
                    [min]="minDate"
                    (change)="onStartDateChange()"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required>
                  <div *ngIf="leaveForm.get('startDate')?.errors?.['min']" class="text-red-500 text-sm mt-1">
                    Start date cannot be in the past
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input 
                    type="date"
                    formControlName="endDate"
                    [min]="getMinEndDate()"
                    (change)="validateEndDate()"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required>
                  <div *ngIf="leaveForm.get('endDate')?.errors?.['min']" class="text-red-500 text-sm mt-1">
                    End date cannot be before start date
                  </div>
                  <div *ngIf="totalDays > 0" class="text-sm text-gray-600 mt-1">
                    Total days: {{ totalDays }} {{ totalDays === 1 ? 'day' : 'days' }}
                  </div>
                  <div *ngIf="selectedLeaveType?.isAnnualLeave && totalDays > 0" 
                       [class.text-red-500]="totalDays > availableAnnualLeave"
                       class="text-sm mt-1">
                    {{ totalDays > availableAnnualLeave ? 
                       'Exceeds available days by ' + (totalDays - availableAnnualLeave) : 
                       (availableAnnualLeave - totalDays) + ' days remaining' }}
                  </div>
                </div>

                <div class="flex items-center">
                  <input 
                    type="checkbox"
                    formControlName="isHalfDay"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                  <label class="ml-2 block text-sm text-gray-900">Half Day</label>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                <textarea 
                  formControlName="reason"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter reason for leave (optional)"></textarea>
              </div>

              <div *ngIf="selectedLeaveType?.id !== 2" class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Attachment</label>
                <input 
                  type="file"
                  (change)="onFileSelected($event)"
                  accept=".pdf,.doc,.docx,.png,.jpg"
                  class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                <p class="text-xs text-gray-500">Please attach supporting documents (PDF, DOC, DOCX, PNG, JPG)</p>
              </div>

              <div class="flex justify-end space-x-3 mt-6">
                <button 
                  type="button"
                  (click)="onCancel()"
                  class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Cancel
                </button>
                <button 
                  type="submit"
                  [disabled]="isSubmitDisabled"
                  class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LeaveRequestDialogComponent implements OnInit {
  @Input() startDate?: string;
  @Output() close = new EventEmitter<any>();
  @Output() submit = new EventEmitter<any>();

  leaveForm: FormGroup;
  selectedFile: File | null = null;
  selectedLeaveType: any = null;
  minDate: string;
  totalDays: number = 0;
  leaveTypes: any[] = [];
  holidays: any[] = [];
  availableAnnualLeave: number = 0;
  isSubmitDisabled: boolean = true;

  constructor(
    private fb: FormBuilder,
    private leaveBalanceService: LeaveBalanceService
  ) {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    this.leaveForm = this.fb.group({
      leaveTypeId: ['', Validators.required],
      startDate: [this.minDate, [Validators.required, this.minDateValidator()]],
      endDate: ['', [this.minDateValidator()]],
      isHalfDay: [false],
      reason: ['']
    });

    this.leaveForm.get('leaveTypeId')?.valueChanges.subscribe(id => {
      this.selectedLeaveType = this.leaveTypes.find(type => type.id == id);
      if (this.selectedLeaveType?.isAnnualLeave) {
        this.checkAnnualLeaveAvailability();
      } else {
        this.isSubmitDisabled = !this.leaveForm.valid;
      }
    });

    this.leaveForm.get('startDate')?.valueChanges.subscribe(() => {
      this.calculateTotalDays();
      if (this.selectedLeaveType?.isAnnualLeave) {
        this.checkAnnualLeaveAvailability();
      }
    });

    this.leaveForm.get('endDate')?.valueChanges.subscribe(() => {
      this.calculateTotalDays();
      if (this.selectedLeaveType?.isAnnualLeave) {
        this.checkAnnualLeaveAvailability();
      }
    });

    this.leaveForm.get('isHalfDay')?.valueChanges.subscribe(() => {
      this.calculateTotalDays();
      if (this.selectedLeaveType?.isAnnualLeave) {
        this.checkAnnualLeaveAvailability();
      }
    });
  }

  ngOnInit(): void {
    this.loadLeaveTypes();
    this.loadHolidays();
    this.loadAvailableAnnualLeave();
  }

  loadAvailableAnnualLeave(): void {
    this.leaveBalanceService.getMyLeaveBalances().subscribe({
      next: (balances: any) => {
        this.availableAnnualLeave = balances[0] ? balances[0].balance : 0;
        this.filterLeaveTypes();
      },
      error: (error) => {
        console.error('Error loading annual leave balance:', error);
      }
    });
  }

  filterLeaveTypes(): void {
    this.leaveBalanceService.getLeaveTypes().subscribe({
      next: (types) => {
        // Filter out annual leave if no days are available
        this.leaveTypes = types.filter(type =>
          !type.isAnnualLeave || this.availableAnnualLeave > 0
        );
        // If we have a leaveTypeId selected, set the selectedLeaveType
        const selectedId = this.leaveForm.get('leaveTypeId')?.value;
        if (selectedId) {
          this.selectedLeaveType = this.leaveTypes.find(type => type.id === selectedId);
          console.log('Selected leave type after filtering:', this.selectedLeaveType);
        }
      },
      error: (error) => {
        console.error('Error loading leave types:', error);
      }
    });
  }

  checkAnnualLeaveAvailability(): void {
    if (this.selectedLeaveType?.isAnnualLeave) {
      if (this.totalDays > this.availableAnnualLeave) {
        this.isSubmitDisabled = true;
      } else {
        this.checkMaxDays();
      }
    } else {
      this.checkMaxDays();
    }
  }

  calculateTotalDays(): void {
    const startDate = this.leaveForm.get('startDate')?.value;
    const endDate = this.leaveForm.get('endDate')?.value;
    const isHalfDay = this.leaveForm.get('isHalfDay')?.value;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      let days = 0;

      // Calculate total days excluding weekends and holidays
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const day = d.getDay();
        const dateStr = d.toISOString().split('T')[0];

        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (day !== 0 && day !== 6) {
          // Check if the date is a holiday
          const isHoliday = this.holidays.some(holiday =>
            holiday.date === dateStr
          );

          if (!isHoliday) {
            days++;
          }
        }
      }

      // If it's a half day, count as 0.5 days
      this.totalDays = isHalfDay ? 0.5 : days;

      // Check annual leave availability after calculating total days
      if (this.selectedLeaveType?.isAnnualLeave) {
        this.checkAnnualLeaveAvailability();
      }
    } else {
      this.totalDays = 0;
    }
  }

  minDateValidator() {
    return (control: any) => {
      const selectedDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today ? null : { min: true };
    };
  }

  getMinEndDate(): string {
    const startDate = this.leaveForm.get('startDate')?.value;
    return startDate || this.minDate;
  }

  onStartDateChange() {
    this.calculateTotalDays();
  }

  validateEndDate() {
    const startDate = this.leaveForm.get('startDate')?.value;
    const endDate = this.leaveForm.get('endDate')?.value;

    if (startDate && endDate && endDate < startDate) {
      this.leaveForm.patchValue({ endDate: startDate });
    }
    this.calculateTotalDays();

    if (this.selectedLeaveType?.isAnnualLeave) {
      if (this.totalDays > this.availableAnnualLeave) {
        Swal.fire({
          title: 'Insufficient Leave Balance',
          text: `You only have ${this.availableAnnualLeave} days of annual leave available`,
          icon: 'warning'
        });
        this.isSubmitDisabled = true;
      } else {
        this.checkMaxDays();
      }
    } else {
      this.checkMaxDays();
    }
  }

  checkMaxDays(): void {
    if (this.selectedLeaveType?.maxDays && this.totalDays > this.selectedLeaveType.maxDays) {
      Swal.fire({
        title: 'Maximum Days Exceeded',
        text: `This leave type has a maximum of ${this.selectedLeaveType.maxDays} days`,
        icon: 'warning'
      });
      this.isSubmitDisabled = true;
    } else {
      this.isSubmitDisabled = !this.leaveForm.valid;
    }
  }

  ngOnChanges(): void {
    if (this.startDate) {
      this.leaveForm.patchValue({ startDate: this.startDate });
      this.leaveForm.patchValue({ endDate: this.startDate });
      this.calculateTotalDays();
    }
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  onSubmit(): void {
    if (this.leaveForm.valid) {
      const formValue = this.leaveForm.value;
      const request: any = {
        ...formValue,
        attachment: this.selectedFile || undefined
      };
      // Should be form data
      const formData = new FormData();
      formData.append('leaveTypeId', formValue.leaveTypeId);
      formData.append('startDate', formValue.startDate);
      formData.append('endDate', formValue.endDate);
      formData.append('isHalfDay', formValue.isHalfDay);
      formData.append('reason', formValue.reason);
      formData.append('attachment', this.selectedFile || '');
      this.submit.emit(formData);
      this.close.emit();
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  loadLeaveTypes(): void {
    this.leaveBalanceService.getLeaveTypes().subscribe({
      next: (types) => {
        this.leaveTypes = types;
        const selectedId = this.leaveForm.get('leaveTypeId')?.value;
        if (selectedId) {
          this.selectedLeaveType = this.leaveTypes.find(type => type.id === selectedId);
        }
      },
      error: (error) => {
        console.error('Error loading leave types:', error);
      }
    });
  }

  loadHolidays(): void {
    this.leaveBalanceService.getHolidays().subscribe({
      next: (holidays) => {
        this.holidays = holidays;
      },
      error: (error) => {
        console.error('Error loading holidays:', error);
      }
    });
  }

  updateSubmitButtonState(): void {
    if (this.selectedLeaveType?.isAnnualLeave) {
      if (this.totalDays > this.availableAnnualLeave) {
        this.isSubmitDisabled = true;
      } else {
        this.checkMaxDays();
      }
    } else {
      this.checkMaxDays();
    }
  }
} 