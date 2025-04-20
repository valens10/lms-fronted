import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class LeaveBalanceService {
    private apiUrl = environment.apiUrl;
    private token = sessionStorage.getItem('token');

    private httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`
        })
    };

    constructor(private http: HttpClient) { }

    getLeaveBalances(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl + '/api/leave-balances', this.httpOptions);
    }

    getLeaveTypes(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl + '/api/leaves/types/leave-types', this.httpOptions);
    }

    createLeaveType(payload: any): Observable<any> {
        return this.http.post<any>(this.apiUrl + '/api/leaves/types/leave-types', payload, this.httpOptions);
    }

    updateLeaveType(id: number, payload: any): Observable<any> {
        return this.http.put<any>(this.apiUrl + '/api/leaves/types/leave-types/' + id, payload, this.httpOptions);
    }

    deleteLeaveType(id: number): Observable<any> {
        return this.http.delete<any>(this.apiUrl + '/api/leaves/types/leave-types/' + id, this.httpOptions);
    }

    getCurrentLeaves(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl + '/api/leaves/current_leaves', this.httpOptions);
    }

    getUsers(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/api/users`, this.httpOptions);
    }

    createLeaveBalance(payload: any): Observable<any> {
        return this.http.post<any>(this.apiUrl + '/api/leave-balances', payload, this.httpOptions);
    }

    // Departments
    getDepartments(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl + '/api/departments', this.httpOptions);
    }

    createDepartment(payload: any): Observable<any> {
        return this.http.post<any>(this.apiUrl + '/api/departments', payload, this.httpOptions);
    }

    updateDepartment(id: number, payload: any): Observable<any> {
        return this.http.put<any>(this.apiUrl + '/api/departments/' + id, payload, this.httpOptions);
    }

    deleteDepartment(id: number): Observable<any> {
        return this.http.delete<any>(this.apiUrl + '/api/departments/' + id, this.httpOptions);
    }

    updateLeaveBalance(id: string, payload: any): Observable<any> {
        return this.http.put<any>(this.apiUrl + '/api/leave-balances/' + id, payload, this.httpOptions);
    }

    deleteLeaveBalance(id: string): Observable<any> {
        return this.http.delete<any>(this.apiUrl + '/api/leave-balances/' + id, this.httpOptions);
    }

    // Leave Request Methods
    getLeaveRequests(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl + '/api/leaves/pending', this.httpOptions);
    }

    approveLeaveRequest(requestId: string, comments: string): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/api/leaves/${requestId}/approve`, { comments }, this.httpOptions);
    }

    rejectLeaveRequest(requestId: string, comments: string): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/api/leaves/${requestId}/reject`, { comments }, this.httpOptions);
    }

    getRoles(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/api/users/roles`, this.httpOptions);
    }

    updateUserRole(userId: number, role: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/api/users/assign_role`, { userId, role }, this.httpOptions);
    }

    deleteUser(userId: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/api/users/${userId}`, this.httpOptions);
    }

    getUnreadNotificationCount(): Observable<number> {
        return this.http.get<number>(`${this.apiUrl}/api/notifications/unread/count`, this.httpOptions);
    }

    getNotifications(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/api/notifications`, this.httpOptions);
    }

    markNotificationAsRead(notificationId: number): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/api/notifications/${notificationId}/read`, {}, this.httpOptions);
    }

    getHolidays(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl + '/api/holidays', this.httpOptions);
    }

    createHoliday(payload: any): Observable<any> {
        return this.http.post<any>(this.apiUrl + '/api/holidays', payload, this.httpOptions);
    }

    deleteHoliday(id: number): Observable<any> {
        return this.http.delete<any>(this.apiUrl + '/api/holidays/' + id, this.httpOptions);
    }


    getMyWorkflows(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/api/leaves/workflows/my-workflows`, this.httpOptions);
    }


    getMyLeaveBalances(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/api/leave-balances/my-balances`, this.httpOptions);
    }

    getMyLeaves(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/api/leaves/my-leaves`, this.httpOptions);
    }

    getPendingRequestsCount(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/api/leaves/pending/count`, this.httpOptions);
    }

    requestLeave(request: any): Observable<any[]> {
        const fhttpOptions = {
            headers: new HttpHeaders({
                Authorization: 'Bearer ' + this.token
            }),
        };
        return this.http.post<any[]>(`${this.apiUrl}/api/leaves/request`, request, fhttpOptions);
    }

    viewLeaveAttachment(attachment: string) {
        // view the attachment in a new tab
        window.open(`${this.apiUrl}/api/leaves/attachments/${attachment}`, '_blank');
    }

    deleteLeave(leaveId: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/api/leaves/${leaveId}`, this.httpOptions);
    }

    getEmployeeReport(userId: number, startDate?: string, endDate?: string): Observable<any> {
        let url = `${this.apiUrl}/api/leaves/reports/employee/${userId}`;

        // Default
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        return this.http.get<any>(url, this.httpOptions);
    }

    getLeaveTypeReport(leaveTypeId: number, startDate?: string, endDate?: string): Observable<any> {
        let url = `${this.apiUrl}/api/leaves/reports/leave-type/${leaveTypeId}`;

        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }

        return this.http.get<any>(url, this.httpOptions);
    }

    getDepartmentReport(departmentId: number, startDate?: string, endDate?: string): Observable<any> {
        let url = `${this.apiUrl}/api/leaves/reports/department/${departmentId}`;

        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }

        return this.http.get<any>(url, this.httpOptions);
    }

    getSummaryReport(startDate?: string, endDate?: string): Observable<any> {
        let url = `${this.apiUrl}/api/leaves/reports/summary`;

        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }

        return this.http.get<any>(url, this.httpOptions);
    }

} 