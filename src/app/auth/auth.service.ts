import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, retry, catchError, throwError } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    token = window.sessionStorage.getItem('token');
    apiUrl = environment.apiUrl;


    httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + this.token,
        }),
    };
    fhttpOptions = {
        headers: new HttpHeaders({
            Authorization: 'Bearer ' + this.token,
        }),
    };




    constructor(private http: HttpClient, private router: Router) {
        this.token = window.sessionStorage.getItem('token');

        if (this.token) {
            this.httpOptions = {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.token}`,
                }),
            };

            this.fhttpOptions = {
                headers: new HttpHeaders({
                    Authorization: 'Bearer ' + this.token,
                }),
            };

        }
    }


    login(token: any): Observable<any> {
        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
            }),
        };
        return this.http
            .get<any>(
                this.apiUrl + '/api/users/user_details',
                httpOptions
            )
            .pipe(retry(1), catchError(this.handleError));
    }

    loginWithGoogle() {
        // TODO: Implement Google OAuth login -- open new tab with google login page
        return window.open(`${this.apiUrl}/oauth2/authorization/google`, '_blank');

    }

    logout(): void {
        localStorage.removeItem('token');
        this.router.navigate(['/auth/login']);
    }

    isAuthenticated(): boolean {
        return this.token ? true : false;
    }

    private handleError(error: any) {
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
            errorMessage = error.error.message;
        } else {
            errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        return throwError(() => errorMessage);
    }
} 