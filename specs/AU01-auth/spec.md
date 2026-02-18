# Feature Specification: Authentication (AU01)

**Feature Code**: `AU01`

## User Stories

### User Story 1 - Email Login (Priority: P1)

An existing user visits the login page and signs in with their email and password. On success, they are redirected to the home page. On failure, the form displays the API error message. A loading state prevents duplicate submissions. If an unexpected exception occurs, a generic fallback error is shown.

**Why this priority**: Login is the primary entry point for returning users. Without it, no authenticated feature is accessible.

**Independent Test**: Can be fully tested by rendering the login form, filling in credentials, submitting, and verifying redirect or error display.

**Acceptance Scenarios**:

1. **US1.1** — **Given** the login form is displayed, **When** the user enters valid credentials and submits, **Then** signIn.email is called and the user is redirected to the home page.
2. **US1.2** — **Given** the login form is displayed, **When** the API returns an error (e.g., "Invalid credentials"), **Then** the error message is displayed and the user is not redirected.
3. **US1.3** — **Given** a login submission is in progress, **When** the form is waiting for a response, **Then** the submit button shows "Signing in..." and is disabled.
4. **US1.4** — **Given** the login form is displayed, **When** an unexpected exception occurs during submission, **Then** a "Something went wrong" fallback error is displayed.
5. **US1.5** — **Given** the login page is visited, **When** the form renders, **Then** email and password fields, a Login button, and a sign-up link are displayed.

---

### User Story 2 - Account Registration (Priority: P1)

A new user visits the signup page and creates an account with name, email, password, and password confirmation. On success, they are redirected to the home page. Client-side validation checks that passwords match before calling the API. API errors and unexpected exceptions are handled gracefully.

**Why this priority**: Registration is the entry point for new users. Without it, no new accounts can be created.

**Independent Test**: Can be fully tested by rendering the signup form, filling in all fields, submitting, and verifying redirect, validation errors, or API error display.

**Acceptance Scenarios**:

1. **US2.1** — **Given** the signup form is displayed, **When** the user enters valid data and submits, **Then** signUp.email is called and the user is redirected to the home page.
2. **US2.2** — **Given** the signup form is displayed, **When** the user enters mismatched passwords and submits, **Then** a "Passwords do not match" error is displayed and the API is not called.
3. **US2.3** — **Given** the signup form is displayed, **When** the API returns an error (e.g., "Email already exists"), **Then** the error message is displayed and the user is not redirected.
4. **US2.4** — **Given** a signup submission is in progress, **When** the form is waiting for a response, **Then** the submit button shows "Creating account..." and is disabled.
5. **US2.5** — **Given** the signup form is displayed, **When** an unexpected exception occurs during submission, **Then** a "Something went wrong" fallback error is displayed.
6. **US2.6** — **Given** the signup page is visited, **When** the form renders, **Then** name, email, password, and confirm password fields, a Create Account button, and a sign-in link are displayed.

---

### User Story 3 - Social Login (Priority: P2)

Users can sign in or sign up using Google or GitHub OAuth. Social login buttons appear on both the login and signup forms when the respective provider is enabled. Clicking a social button initiates the OAuth flow with the correct provider and callback URL.

**Why this priority**: Social login reduces friction for users who prefer not to create a separate password, but email/password must work first.

**Independent Test**: Can be fully tested by rendering login/signup forms with providers enabled, clicking each social button, and verifying signIn.social is called with the correct provider and callbackURL.

> **Note**: OAuth failure handling (invalid tokens, provider errors) is managed entirely by Better Auth's callback flow — no application-level error scenario is needed.

**Acceptance Scenarios**:

1. **US3.1** — **Given** the login form is rendered with Google enabled, **When** the user clicks the Google button, **Then** signIn.social is called with `{ provider: "google", callbackURL: "/" }`.
2. **US3.2** — **Given** the login form is rendered with GitHub enabled, **When** the user clicks the GitHub button, **Then** signIn.social is called with `{ provider: "github", callbackURL: "/" }`.
3. **US3.3** — **Given** the signup form is rendered with Google enabled, **When** the user clicks the Google button, **Then** signIn.social is called with `{ provider: "google", callbackURL: "/" }`.
4. **US3.4** — **Given** the signup form is rendered with GitHub enabled, **When** the user clicks the GitHub button, **Then** signIn.social is called with `{ provider: "github", callbackURL: "/" }`.
5. **US3.5** — **Given** both Google and GitHub are enabled, **When** the login or signup form renders, **Then** both social login buttons are displayed.

---

### User Story 4 - Route Protection (Priority: P1)

API endpoints require authentication — unauthenticated requests receive a 401 response. The Next.js proxy middleware redirects unauthenticated users away from protected pages to /login, and redirects authenticated users away from auth pages (/login, /signup) to the home page.

**Why this priority**: Route protection is a security requirement. Without it, unauthenticated users could access private data and authenticated users would see unnecessary auth pages.

**Independent Test**: Can be fully tested by making API requests without a session (expect 401) and by navigating to protected/auth pages with and without a session cookie.

> **Note**: `/api/auth/*` routes are public (handled by Better Auth directly via `mount`). All other module routes use the `{ auth: true }` Elysia macro for protection.

**Acceptance Scenarios**:

1. **US4.1** — **Given** an unauthenticated request, **When** it hits any protected API endpoint, **Then** the API returns 401 without reaching the service layer.
2. **US4.2** — **Given** an unauthenticated user, **When** they navigate to a protected page, **Then** they are redirected to /login.
3. **US4.3** — **Given** an authenticated user, **When** they navigate to /login or /signup, **Then** they are redirected to the home page.
4. **US4.4** — **Given** an unauthenticated user, **When** they navigate to /login or /signup, **Then** the page is served without redirect.
5. **US4.5** — **Given** an authenticated user, **When** they navigate to a protected page, **Then** the page is served without redirect.

---

### User Story 5 - Session Management (Priority: P1)

Authentication state is managed via cookie-based sessions using Better Auth. The `useSession` hook provides session data to client components. Sessions persist across page reloads until the user signs out.

**Why this priority**: Session management underpins all authenticated features. Without persistent sessions, users would need to re-authenticate on every page load.

**Independent Test**: Can be tested by logging in, refreshing the page, and verifying the session persists via useSession hook.

> **Note**: US5.1 and US5.2 are integration-level concerns — they test Better Auth's `useSession` and `signOut` behavior directly. No unit tests are needed since these delegate entirely to the library. They are covered implicitly when components consuming `useSession` are tested (e.g., board shell checking session state).

**Acceptance Scenarios**:

1. **US5.1** — **Given** a user has signed in, **When** any client component calls useSession, **Then** the session data (user info) is available.
2. **US5.2** — **Given** a user is authenticated, **When** they call signOut, **Then** the session is cleared and they are redirected.

---

### Cross-Cutting Concerns

1. **CC1** — **Given** a login or signup form submission is in progress, **When** the user clicks submit again, **Then** the submit button is disabled to prevent duplicate submissions.
2. **CC2** — **Given** the API returns an error during login or signup, **When** the error is displayed, **Then** the form retains the user's input so they can retry without retyping.
3. **CC3** — **Given** an unexpected exception occurs during any auth operation, **When** the error is caught, **Then** a generic "Something went wrong" fallback error is displayed.

## Key Entities

- **User**: A registered account. Has a name, email, and hashed password. May have linked OAuth accounts.
- **Session**: A cookie-based authentication token linking a browser to a user. Managed by Better Auth. Checked on every protected request.
- **Account**: An OAuth provider link (Google, GitHub) associated with a user. Enables social login without a password.

## Key Decisions

- **Better Auth over NextAuth**: Better Auth integrates natively with Elysia via plugin, avoids Next.js-specific coupling, and supports the Drizzle adapter directly.
- **Cookie-based sessions**: Simpler than JWT for server-rendered apps. No token refresh logic needed. Better Auth handles cookie lifecycle automatically.
- **Proxy middleware for route protection**: Uses Next.js middleware (`src/proxy.ts`) with `getSessionCookie` to check auth state before page render. Avoids layout shift from client-side redirects.
- **Client-side password match check**: The confirm-password validation runs before the API call to avoid an unnecessary round trip. The server does not receive the confirm-password field.
- **Conditional social buttons via props**: `enabledProviders` prop controls which OAuth buttons render. This allows the form to adapt based on server-side env var availability without hardcoding providers.
