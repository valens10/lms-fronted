import { Component, OnInit, ViewChild, ViewContainerRef, OnDestroy } from '@angular/core';
import { CalendarOptions, EventInput, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import multiMonthPlugin from '@fullcalendar/multimonth';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveBalanceService } from '../services/leave-balance.service';
import Swal from 'sweetalert2';
import { LeaveRequestDialogComponent } from './leave-request-dialog/leave-request-dialog.component';
import { ComponentRef } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('dialogContainer', { read: ViewContainerRef }) dialogContainer!: ViewContainerRef;
  private dialogComponentRef: ComponentRef<LeaveRequestDialogComponent> | null = null;
  leaveBalances: any = {};
  leaves: any[] = [];
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
    events: [],
    dayCellClassNames: (arg) => {
      const classes = [];
      if (arg.isToday) {
        classes.push('bg-blue-100', 'font-bold', 'text-blue-800', 'ring-2', 'ring-blue-600', 'ring-offset-2');
      }
      if (arg['isWeekend']) {
        classes.push('bg-gray-50');
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const cellDate = new Date(arg.date);
      cellDate.setHours(0, 0, 0, 0);
      if (cellDate < today) {
        classes.push('text-gray-400', 'cursor-not-allowed');
      }
      return classes;
    },
    selectAllow: (selectInfo) => {
      const date = new Date(selectInfo.start);
      const today = new Date();
      // Reset both dates to midnight
      date.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isHoliday = this.holidays.some(holiday =>
        new Date(holiday.date).toISOString().split('T')[0] === selectInfo.startStr
      );
      const isPastDate = date < today;
      return !isWeekend && !isHoliday && !isPastDate;
    }
  };

  constructor(
    private leaveBalanceService: LeaveBalanceService
  ) {
    this.user = JSON.parse(sessionStorage.getItem('user') || '{}');
    this.isAdminOrManager = this.user.roles?.some((role: string) => ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(role));
  }

  ngOnInit(): void {
    this.loadLeaveBalances();

    this.loadLeaves();
    this.loadHolidays();
    this.checkUserRole();

    // Check if user is admin or manager
    if (this.isAdminOrManager) {
      this.loadPendingRequestsCount();
    }
  }

  ngOnDestroy(): void {
    this.cleanupDialog();
  }

  private cleanupDialog(): void {
    if (this.dialogComponentRef) {
      this.dialogComponentRef.destroy();
      this.dialogComponentRef = null;
    }
  }

  loadLeaveBalances(): void {
    this.leaveBalanceService.getMyLeaveBalances().subscribe({
      next: (balances: any) => {
        this.leaveBalances = balances[0];
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
        this.updateCalendarEvents();
      },
      error: (error: any) => {
        console.error('Error loading leaves:', error);
      }
    });
  }

  loadHolidays(): void {
    this.leaveBalanceService.getHolidays().subscribe({
      next: (holidays: any[]) => {
        this.holidays = holidays.sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        this.updateCalendarEvents();
      },
      error: (error: any) => {
        console.error('Error loading holidays:', error);
      }
    });
  }

  updateCalendarEvents(): void {
    // Create leave events
    const leaveEvents: EventInput[] = this.leaves.map(leave => ({
      id: leave.id.toString(),
      title: `${leave.leaveType.name} - ${leave.status}`,
      start: leave.startDate,
      end: leave.endDate,
      backgroundColor: this.getEventColor(leave.leaveType.id, leave.status),
      textColor: '#ffffff',
      borderColor: 'transparent',
      extendedProps: { leave }
    }));

    // Create holiday events
    const holidayEvents: EventInput[] = this.holidays.map(holiday => ({
      id: `holiday-${holiday.id}`,
      title: holiday.name,
      start: holiday.date,
      allDay: true,
      backgroundColor: '#F59E0B',
      borderColor: '#F59E0B',
      textColor: '#000000',
      classNames: ['holiday-event']
    }));

    // Combine all events
    this.calendarOptions.events = [...leaveEvents, ...holidayEvents];
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

  handleDateClick(arg: { dateStr: string }): void {
    const clickedDate = new Date(arg.dateStr);
    const today = new Date();
    // Reset both dates to midnight
    clickedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const isWeekend = clickedDate.getDay() === 0 || clickedDate.getDay() === 6;
    const isHoliday = this.holidays.some(holiday =>
      new Date(holiday.date).toISOString().split('T')[0] === arg.dateStr
    );
    const isPastDate = clickedDate < today;

    if (isPastDate) {
      Swal.fire({
        title: 'Not Allowed',
        text: 'Cannot request leave for past dates',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (isWeekend) {
      Swal.fire({
        title: 'Not Allowed',
        text: 'Cannot request leave for weekends',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (isHoliday) {
      Swal.fire({
        title: 'Not Allowed',
        text: 'Cannot request leave for holidays',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    this.openLeaveRequestDialog(arg.dateStr);
  }

  handleEventClick(arg: EventClickArg): void {
    if (arg.event.id?.startsWith('holiday-')) {
      return;
    }

    this.selectedLeave = arg.event.extendedProps['leave'];
    this.showLeaveDetails = true;
  }

  openLeaveRequestDialog(selectedDate?: string): void {
    this.cleanupDialog();

    if (this.dialogContainer) {
      this.dialogComponentRef = this.dialogContainer.createComponent(LeaveRequestDialogComponent);
      if (selectedDate) {
        this.dialogComponentRef.instance.selectedDate = selectedDate;
      }
      this.dialogComponentRef.instance.dialogClosed.subscribe(() => {
        this.cleanupDialog();
        this.loadLeaves();
        this.loadLeaveBalances();
      });
    }
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
          Swal.fire({
            title: 'Success',
            text: 'Leave request deleted successfully',
            icon: 'success'
          });
        },
        error: (error) => {
          console.error('Error deleting leave:', error);
          Swal.fire({
            title: 'Error',
            text: 'Error deleting leave request',
            icon: 'error'
          });
        }
      });
    }
  }

  viewAttachment(): void {
    if (this.selectedLeave?.attachment) {
      this.leaveBalanceService.viewLeaveAttachment(this.selectedLeave?.attachment)
    }
  }

  checkUserRole(): void {
    this.isAdminOrManager = this.user.roles?.some((role: string) => ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(role));
  }
} 