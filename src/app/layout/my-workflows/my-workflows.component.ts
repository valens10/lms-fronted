import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import Swal from 'sweetalert2';
import { LeaveBalanceService } from 'src/app/services/leave-balance.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-my-workflows',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './my-workflows.component.html',
    providers: [DatePipe]
})
export class MyWorkflowsComponent implements OnInit {
    workflows: any = [];
    isLoading = true;
    selectedWorkflow: any = null;
    isModalOpen = false;
    hostUrl = environment.apiUrl;

    constructor(
        private leaveWorkflowService: LeaveBalanceService,
        private datePipe: DatePipe
    ) { }

    ngOnInit(): void {
        this.loadWorkflows();
    }

    loadWorkflows(): void {
        this.isLoading = true;
        this.leaveWorkflowService.getMyWorkflows().subscribe({
            next: (data) => {
                this.workflows = data;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading workflows:', error);
                this.isLoading = false;
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to load leave workflows',
                    icon: 'error',
                    confirmButtonColor: '#10B981'
                });
            }
        });
    }

    openDetailsModal(workflow: any): void {
        this.selectedWorkflow = workflow;
        this.isModalOpen = true;
    }

    closeModal(): void {
        this.isModalOpen = false;
        this.selectedWorkflow = null;
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'APPROVED':
                return 'bg-emerald-100 text-emerald-800';
            case 'REJECTED':
                return 'bg-red-100 text-red-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    getStatusText(status: string): string {
        return status.charAt(0) + status.slice(1).toLowerCase();
    }

    viewLeaveAttachment(fileName: any): void {
        this.leaveWorkflowService.viewLeaveAttachment(fileName)
    }
} 