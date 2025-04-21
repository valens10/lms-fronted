import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LeaveBalanceService } from '../../services/leave-balance.service';
import Swal from 'sweetalert2';

interface LeaveType {
    id: number;
    name: string;
    isAnnualLeave: boolean;
    maxDays: number;
}

interface LeaveBalance {
    leaveTypeId: number;
    balance: number;
}

@Component({
    selector: 'app-leave-request-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './leave-request-dialog.component.html',
    styleUrls: ['./leave-request-dialog.component.css']
})
export class LeaveRequestDialogComponent implements OnInit {
    @Input() selectedDate?: string;
    @Output() dialogClosed = new EventEmitter<void>();
    leaveRequestForm: FormGroup;
    leaveTypes: LeaveType[] = [];
    availableBalance: number = 0;
    totalDays: number = 1;
    isHalfDay: boolean = false;
    minDate: string;
    selectedFile: File | null = null;
    today: string = new Date().toISOString().split('T')[0];

    constructor(
        private fb: FormBuilder,
        private leaveBalanceService: LeaveBalanceService
    ) {
        this.minDate = new Date().toISOString().split('T')[0];
        this.leaveRequestForm = this.fb.group({
            leaveTypeId: ['', Validators.required],
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],
            isHalfDay: [false],
            reason: [''],
            attachment: [null]
        });
    }

    ngOnInit(): void {
        this.loadAvailableBalance()
        this.loadHolidays();
        // Set start date based on how dialog was opened
        const startDate = this.selectedDate || new Date().toISOString().split('T')[0];
        this.leaveRequestForm.patchValue({
            startDate: startDate,
            endDate: startDate
        });
        this.setupFormListeners();
    }


    holidays: any[] = [];
    loadHolidays(): void {
        this.leaveBalanceService.getHolidays().subscribe({
            next: (holidays: any[]) => {
                this.holidays = holidays.sort((a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                );
            },
            error: (error: any) => {
                console.error('Error loading holidays:', error);
            }
        });
    }

    selectedLeaveType: LeaveType | null = null;
    private setupFormListeners() {
        this.leaveRequestForm.get('isHalfDay')?.valueChanges.subscribe(isHalfDay => {
            this.isHalfDay = isHalfDay;
            if (isHalfDay) {
                const startDate = this.leaveRequestForm.get('startDate')?.value;
                this.leaveRequestForm.get('endDate')?.setValue(startDate);
            }
        });

        this.leaveRequestForm.get('leaveTypeId')?.valueChanges.subscribe(leaveTypeId => {
            this.selectedLeaveType = this.leaveTypes.find(type => type.id == leaveTypeId) || null;
        });

        this.leaveRequestForm.get('startDate')?.valueChanges.subscribe(() => {
            this.calculateTotalDays();
        });

        this.leaveRequestForm.get('endDate')?.valueChanges.subscribe(() => {
            this.calculateTotalDays();
        });
    }

    private loadLeaveTypes(): void {
        this.leaveBalanceService.getLeaveTypes().subscribe({
            next: (types: LeaveType[]) => {
                if (!this.availableBalance) {
                    // Exclude annual leave types when no available balance
                    this.leaveTypes = types.filter((type) => !type.isAnnualLeave);
                } else {
                    // Include all leave types if balance is available
                    this.leaveTypes = types;
                }

                console.log('Filtered leaveTypes:', this.leaveTypes);
            },
            error: (error: any) => {
                console.error('Error loading leave types:', error);
            }
        });
    }


    leaveBalances: any = []
    loadAvailableBalance() {
        this.leaveBalanceService.getMyLeaveBalances().subscribe({
            next: (balances: LeaveBalance[]) => {
                this.leaveBalances = balances
                this.availableBalance = this.leaveBalances[0]?.balance || 0;

                this.loadLeaveTypes();
            },
            error: (error: any) => {
                console.error('Error loading leave balance:', error);
            }
        });
    }

    private calculateTotalDays() {
        const startDate = this.leaveRequestForm.get('startDate')?.value;
        const endDate = this.leaveRequestForm.get('endDate')?.value;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            let count = 0;

            const holidays = this.holidays.map(h => new Date(h.date).toDateString());

            for (
                let d = new Date(start);
                d <= end;
                d.setDate(d.getDate() + 1)
            ) {
                const day = d.getDay();
                const isWeekend = day === 0 || day === 6;
                const isHoliday = holidays.includes(d.toDateString());

                if (!isWeekend && !isHoliday) {
                    count++;
                }
            }

            this.totalDays = this.isHalfDay ? 0.5 : count;
        }
    }



    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFile = input.files[0];
            this.leaveRequestForm.patchValue({
                attachment: this.selectedFile
            });
        }
    }

    loading: boolean = false;
    onSubmit() {
        if (this.leaveRequestForm.valid) {
            const formData = new FormData();
            const formValue = this.leaveRequestForm.value;

            const leaveType = this.leaveTypes.find(type => type.id == formValue.leaveTypeId);

            if (leaveType?.isAnnualLeave && this.totalDays > this.availableBalance) {
                //Use Swal to show error
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Requested days exceed available balance',
                })
                return;
            }

            if (leaveType?.maxDays && this.totalDays > leaveType.maxDays) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: `Maximum days allowed for this leave type is ${leaveType.maxDays}`
                })

                return;
            }

            // Validate end date should be greater or equal to start date
            if (new Date(formValue.endDate) < new Date(formValue.startDate)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'End date should be greater or equal to start date',
                })
                return;
            }

            // Append all form fields to FormData
            Object.keys(formValue).forEach(key => {
                if (formValue[key] !== null && formValue[key] !== undefined) {
                    formData.append(key, formValue[key]);
                }
            });

            if (this.selectedFile) {
                formData.append('attachment', this.selectedFile);
            }


            this.loading = true;
            this.leaveBalanceService.requestLeave(formData).subscribe({
                next: (response: any) => {
                    this.dialogClosed.emit();
                    this.loading = false;
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: 'Leave request created successfully',
                    })
                },
                error: (error: any) => {
                    this.loading = false;
                    console.error('Error creating leave request:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: 'Error creating leave request',
                    })
                }
            });
        }
    }

    onCancel() {
        this.dialogClosed.emit();
    }
} 