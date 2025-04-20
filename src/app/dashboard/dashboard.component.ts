import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import multiMonthPlugin from '@fullcalendar/multimonth';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CommonModule } from '@angular/common';
import { LeaveBalanceService } from '../services/leave-balance.service';
import { LeaveRequestDialogComponent } from './leave-request-dialog/leave-request-dialog.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, LeaveRequestDialogComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild('dialogContainer', { read: ViewContainerRef }) dialogContainer!: ViewContainerRef;
  leaveBalances: any[] = [];
  leaves: any[] = [];
  showLeaveDialog: boolean = false;
  selectedStartDate?: string;
  selectedLeave: any = null;
  showLeaveDetails: boolean = false;
  pendingRequestsCount: number = 0;
  holidays: any[] = [];
  user: any;
  isAdminOrManager: boolean = false;
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, multiMonthPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay'
    },
    buttonText: {
      today: 'Today',
      month: 'Month',
      week: 'Week',
      day: 'Day',
      year: 'Year'
    },
    editable: false,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    height: 800,
    dateClick: this.handleDateClick.bind(this),
    eventClick: this.handleEventClick.bind(this),
    events: []
  };

  constructor(
    private leaveBalanceService: LeaveBalanceService
  ) {
    this.user = JSON.parse(sessionStorage.getItem('user') || '{}');
    this.isAdminOrManager = this.user.roles?.some((role: string) => ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(role));
  }

  ngOnInit(): void {
    this.loadLeaveBalances();
    this.loadPendingRequestsCount();
    this.loadLeaves();
    this.loadHolidays();
  }

  loadLeaveBalances(): void {
    this.leaveBalanceService.getMyLeaveBalances().subscribe({
      next: (balances: any[]) => {
        this.leaveBalances = balances;
      },
      error: (error: any) => {
        console.error('Error loading leave balances:', error);
      }
    });
  }

  loadLeaves(): void {
    this.leaveBalanceService.getMyLeaves().subscribe({
      next: (leaves: any[]) => {
        this.leaves = leaves;
        this.updateCalendarEvents(leaves);
      },
      error: (error: any) => {
        console.error('Error loading leaves:', error);
      }
    });
  }

  updateCalendarEvents(leaves: any[]): void {
    const events: EventInput[] = leaves.map(leave => ({
      id: leave.id.toString(),
      title: `${leave.leaveType.name} - ${leave.status}`,
      start: leave.startDate,
      end: leave.endDate,
      backgroundColor: this.getEventColor(leave.leaveType.id, leave.status),
      textColor: '#ffffff',
      borderColor: 'transparent',
      extendedProps: { leave }
    }));

    this.calendarOptions.events = events;
  }

  getEventColor(leaveTypeId: number, status: string): string {
    if (status === 'PENDING') return '#f59e0b';
    if (status === 'REJECTED') return '#ef4444';
    if (status === 'CANCELLED') return '#6b7280';

    switch (leaveTypeId) {
      case 1: return '#3b82f6'; // Annual Leave
      case 2: return '#10b981'; // Sick Leave
      case 3: return '#8b5cf6'; // Maternity Leave
      case 4: return '#ec4899'; // Paternity Leave
      case 5: return '#f97316'; // Unpaid Leave
      default: return '#6b7280';
    }
  }

  handleDateClick(arg: any): void {
    this.selectedStartDate = arg.dateStr;
    this.showLeaveDialog = true;
  }

  handleEventClick(arg: any): void {
    this.selectedLeave = arg.event.extendedProps.leave;
    this.showLeaveDetails = true;
  }

  openLeaveRequestDialog(): void {
    this.selectedStartDate = undefined;
    this.showLeaveDialog = true;
  }

  onLeaveDialogClose(): void {
    this.showLeaveDialog = false;
  }

  onLeaveDialogSubmit(formData: any): void {
    this.leaveBalanceService.requestLeave(formData).subscribe({
      next: () => {
        this.showLeaveDialog = false;
        this.loadLeaves();
        this.loadLeaveBalances();

        // show a Swal message
        Swal.fire({
          title: 'Success',
          text: 'Leave requested successfully',
          icon: 'success'
        });
      },
      error: (error: any) => {
        console.error('Error requesting leave:', error);
      }
    });
  }

  loadPendingRequestsCount(): void {
    this.leaveBalanceService.getPendingRequestsCount().subscribe({
      next: (response: any) => {
        this.pendingRequestsCount = response.count;
      },
      error: (error) => {
        console.error('Error loading pending requests count:', error);
      }
    });
  }

  loadHolidays(): void {
    this.leaveBalanceService.getHolidays().subscribe({
      next: (holidays) => {
        this.holidays = holidays.sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        this.updateCalendarEvents(this.leaves);
      },
      error: (error) => {
        console.error('Error loading holidays:', error);
      }
    });
  }

  closeLeaveDetails(): void {
    this.showLeaveDetails = false;
    this.selectedLeave = null;
  }

  deleteLeave(): void {
    if (this.selectedLeave && this.selectedLeave.status === 'PENDING') {
      this.leaveBalanceService.deleteLeave(this.selectedLeave.id).subscribe({
        next: () => {
          this.closeLeaveDetails();
          this.loadLeaves();
          this.loadLeaveBalances();

          // show a Swal message
          Swal.fire({
            title: 'Success',
            text: 'Leave deleted successfully',
            icon: 'success'
          });
        },
        error: (error: any) => {
          console.error('Error deleting leave:', error);
        }
      });
    }
  }

  viewAttachment(): void {
    if (this.selectedLeave?.attachment) {
      this.leaveBalanceService.viewLeaveAttachment(this.selectedLeave.attachment);
    }
  }
} 