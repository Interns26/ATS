/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated, getUser } from "../lib/auth";

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: string[];
};

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const user = getUser();
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const defaultPath = user.role === "hr_admin" ? "/approval" : "/";
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;