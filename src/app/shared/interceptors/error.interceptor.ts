import { Injectable } from "@angular/core";
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { Router } from "@angular/router";

import { UserService } from "../services/user.service";
import { PAGES } from "../utils/constant";

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private userService: UserService, private router: Router) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((err) => {
        console.log(err);
        // if (err.status === 401) {
        //   // auto logout if 401 response returned from api
        //   this.userService.logout();
        //   // Redirect to login page
        //   this.router.navigate([PAGES.PUBLIC], {
        //     queryParams: { returnUrl: this.router.url },
        //   });
        // }
        const error = err.error.message || err.statusText;
        return throwError(error);
      })
    );
  }
}