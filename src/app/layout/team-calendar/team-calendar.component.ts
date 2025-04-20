import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveBalanceService } from '../../services/leave-balance.service';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions, EventInput } from '@fullcalendar/core';

@Component({
    selector: 'app-team-calendar',
    standalone: true,
    imports: [CommonModule, FormsModule, FullCalendarModule],
    templateUrl: './team-calendar.component.html',
    styles: []
})
export class TeamCalendarComponent implements OnInit {
    departments: any[] = [];
    selectedDepartment: string = '';
    holidays: any[] = [];
    leaves: any[] = [];
    calendarOptions: CalendarOptions = {
        initialView: 'dayGridMonth',
        plugins: [dayGridPlugin, interactionPlugin],
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
        },
        events: [],
        eventColor: '#10B981',
        eventTextColor: '#ffffff',
        eventDisplay: 'block',
        height: 'auto',
        eventDidMount: (info) => {
            // Add tooltip
            info.el.title = info.event.extendedProps['description'];
        }
    };

    constructor(private leaveBalanceService: LeaveBalanceService) { }

    ngOnInit(): void {
        this.loadDepartments();
        this.loadHolidays();
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

    loadHolidays(): void {
        this.leaveBalanceService.getHolidays().subscribe({
            next: (data) => {
                this.holidays = data;
                this.updateCalendarEvents();
            },
            error: (error) => {
                console.error('Error loading holidays:', error);
            }
        });
    }

    onDepartmentChange(): void {
        if (this.selectedDepartment) {
            this.loadDepartmentLeaves();
        } else {
            this.leaves = [];
            this.updateCalendarEvents();
        }
    }

    loadDepartmentLeaves(): void {
        this.leaveBalanceService.getDepartmentReport(Number(this.selectedDepartment)).subscribe({
            next: (data) => {
                this.leaves = data;
                this.updateCalendarEvents();
            },
            error: (error) => {
                console.error('Error loading department leaves:', error);
            }
        });
    }

    updateCalendarEvents(): void {
        const events: EventInput[] = [];

        // Add holidays
        this.holidays.forEach(holiday => {
            events.push({
                title: holiday.name,
                start: holiday.date,
                allDay: true,
                backgroundColor: '#F59E0B',
                borderColor: '#F59E0B',
                extendedProps: {
                    description: 'Public Holiday'
                }
            });
        });

        // Add leaves
        this.leaves.forEach(leave => {
            const statusColor = this.getStatusColor(leave.status);
            events.push({
                title: `${leave.user.firstName} ${leave.user.lastName} - ${leave.leaveType.name}`,
                start: leave.startDate,
                end: leave.endDate,
                allDay: !leave.isHalfDay,
                backgroundColor: statusColor,
                borderColor: statusColor,
                extendedProps: {
                    description: `Status: ${leave.status}\nReason: ${leave.reason || 'No reason provided'}`
                }
            });
        });

        this.calendarOptions.events = events;
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'APPROVED':
                return '#10B981';
            case 'PENDING':
                return '#F59E0B';
            case 'REJECTED':
                return '#EF4444';
            default:
                return '#6B7280';
        }
    }
} 