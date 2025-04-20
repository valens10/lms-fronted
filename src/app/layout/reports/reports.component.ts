import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveBalanceService } from '../../services/leave-balance.service';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Workbook } from 'exceljs';

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './reports.component.html',
    styles: []
})
export class ReportsComponent implements OnInit {
    users: any[] = [];
    leaveTypes: any[] = [];
    departments: any[] = [];
    selectedReportType: string = '';
    selectedEmployee: string = '';
    selectedLeaveType: string = '';
    selectedDepartment: string = '';
    startDate: string = '';
    endDate: string = '';
    reportData: any = null;
    isLoading: boolean = false;

    constructor(private leaveBalanceService: LeaveBalanceService) { }

    ngOnInit(): void {
        this.loadUsers();
        this.loadLeaveTypes();
        this.loadDepartments();
    }

    loadUsers(): void {
        this.leaveBalanceService.getUsers().subscribe({
            next: (data) => {
                this.users = data;
            },
            error: (error) => {
                console.error('Error loading users:', error);
            }
        });
    }

    loadLeaveTypes(): void {
        this.leaveBalanceService.getLeaveTypes().subscribe({
            next: (data) => {
                this.leaveTypes = data;
            },
            error: (error) => {
                console.error('Error loading leave types:', error);
            }
        });
    }

    loadDepartments(): void {
        this.leaveBalanceService.getDepartments().subscribe({
            next: (data) => {
                this.departments = data;
            },
            error: (error) => {
                console.error('Error loading departments:', error);
            }
        });
    }

    onReportTypeChange(): void {
        // Reset specific selections when report type changes
        this.selectedEmployee = '';
        this.selectedLeaveType = '';
        this.selectedDepartment = '';
        this.reportData = null;
    }

    isFormValid(): boolean {
        if (!this.selectedReportType) return false;

        switch (this.selectedReportType) {
            case 'employee':
                return !!this.selectedEmployee;
            case 'leaveType':
                return !!this.selectedLeaveType;
            case 'department':
                return !!this.selectedDepartment;
            case 'summary':
                return true;
            default:
                return false;
        }
    }

    generateReport(): void {
        if (!this.isFormValid()) return;

        this.isLoading = true;
        let apiCall;

        switch (this.selectedReportType) {
            case 'employee':
                apiCall = this.leaveBalanceService.getEmployeeReport(
                    Number(this.selectedEmployee),
                    this.startDate,
                    this.endDate
                );
                break;
            case 'leaveType':
                apiCall = this.leaveBalanceService.getLeaveTypeReport(
                    Number(this.selectedLeaveType),
                    this.startDate,
                    this.endDate
                );
                break;
            case 'department':
                apiCall = this.leaveBalanceService.getDepartmentReport(
                    Number(this.selectedDepartment),
                    this.startDate,
                    this.endDate
                );
                break;
            case 'summary':
                apiCall = this.leaveBalanceService.getSummaryReport(
                    this.startDate,
                    this.endDate
                );
                break;
            default:
                return;
        }

        apiCall.subscribe({
            next: (data) => {
                this.reportData = data;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error generating report:', error);
                this.isLoading = false;
            }
        });
    }

    viewAttachment(attachment: string): void {
        if (attachment) {
            this.leaveBalanceService.viewLeaveAttachment(attachment);
        }
    }

    async exportToExcel(): Promise<void> {
        if (!this.reportData) return;

        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('Report');
        const fileName = `${this.selectedReportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`;

        if (this.selectedReportType === 'summary') {
            // Add title
            worksheet.addRow(['Leave Summary Report']);
            worksheet.addRow([]);

            // Add date range if applicable
            if (this.startDate && this.endDate) {
                worksheet.addRow(['Date Range:', `${this.startDate} to ${this.endDate}`]);
                worksheet.addRow([]);
            }

            // Total Applications
            worksheet.addRow(['Total Applications:', this.reportData.totalApplications]);
            worksheet.addRow([]);

            // Status Count
            worksheet.addRow(['Status Count']);
            Object.entries(this.reportData.statusCount).forEach(([status, count]) => {
                worksheet.addRow([status, count]);
            });
            worksheet.addRow([]);

            // Leave Type Count
            worksheet.addRow(['Leave Type Count']);
            Object.entries(this.reportData.leaveTypeCount).forEach(([type, count]) => {
                worksheet.addRow([type, count]);
            });
            worksheet.addRow([]);

            // Department Count
            worksheet.addRow(['Department Count']);
            Object.entries(this.reportData.departmentCount).forEach(([dept, count]) => {
                worksheet.addRow([dept, count]);
            });
        } else {
            worksheet.addRow([
                'Employee Name',
                'Department',
                'Leave Type',
                'Start Date',
                'End Date',
                'Half Day',
                'Status',
                'Reason',
                'Attachment',
                'Created At',
                'Updated At'
            ]);

            this.reportData.forEach((leave: any) => {
                worksheet.addRow([
                    `${leave.user.firstName} ${leave.user.lastName}`,
                    leave.user.departmentName,
                    leave.leaveType.name,
                    new Date(leave.startDate).toLocaleDateString(),
                    new Date(leave.endDate).toLocaleDateString(),
                    leave.isHalfDay ? 'Yes' : 'No',
                    leave.status,
                    leave.reason || '-',
                    leave.attachment || '-',
                    new Date(leave.createdAt).toLocaleString(),
                    new Date(leave.updatedAt).toLocaleString()
                ]);
            });
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
    }

    exportToPDF(): void {
        if (!this.reportData) return;

        const doc = new jsPDF();
        const fileName = `${this.selectedReportType}_report_${new Date().toISOString().split('T')[0]}.pdf`;

        // Add title
        doc.setFontSize(16);
        doc.text('Leave Report', 20, 20);

        // Add date range if applicable
        if (this.startDate && this.endDate) {
            doc.setFontSize(10);
            doc.text(`Date Range: ${this.startDate} to ${this.endDate}`, 20, 30);
        }

        // Format data for the table
        const headers = [
            'Employee Name',
            'Department',
            'Leave Type',
            'Start Date',
            'End Date',
            'Half Day',
            'Status',
            'Reason',
            'Attachment',
            'Created At',
            'Updated At'
        ];

        const data = this.reportData.map((leave: any) => [
            `${leave.user.firstName} ${leave.user.lastName}`,
            leave.user.departmentName,
            leave.leaveType.name,
            new Date(leave.startDate).toLocaleDateString(),
            new Date(leave.endDate).toLocaleDateString(),
            leave.isHalfDay ? 'Yes' : 'No',
            leave.status,
            leave.reason || '-',
            leave.attachment || '-',
            new Date(leave.createdAt).toLocaleString(),
            new Date(leave.updatedAt).toLocaleString()
        ]);

        // Add the table
        (doc as any).autoTable({
            head: [headers],
            body: data,
            startY: 40,
            theme: 'grid',
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontSize: 8
            },
            styles: {
                fontSize: 7,
                cellPadding: 2
            },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 25 },
                2: { cellWidth: 25 },
                3: { cellWidth: 15 },
                4: { cellWidth: 15 },
                5: { cellWidth: 10 },
                6: { cellWidth: 15 },
                7: { cellWidth: 30 },
                8: { cellWidth: 20 },
                9: { cellWidth: 25 },
                10: { cellWidth: 25 }
            }
        });

        doc.save(fileName);
    }

    resetForm(): void {
        this.selectedReportType = '';
        this.selectedEmployee = '';
        this.selectedLeaveType = '';
        this.selectedDepartment = '';
        this.startDate = '';
        this.endDate = '';
        this.reportData = null;
    }
} 