// app/lib/navigation.ts
// Simple navigation utility for SPA mode that avoids window.location.replace

let navigateFn: ((path: string) => void) | null = null

/**
 * Sets the navigation function (called from root layout during app initialization).
 * This allows us to use React Router's navigate instead of window.location.replace
 * which causes a full page reload.
 */
export function setNavigate(fn: (path: string) => void): void {
	navigateFn = fn
}

/**
 * Navigates to the given path using the registered navigate function,
 * or falls back to window.location.replace if not set.
 */
export function navigateTo(path: string): void {
	if (navigateFn) {
		navigateFn(path)
	} else {
		// Fallback for edge cases where navigate isn't set yet
		window.location.href = path
	}
}

/**
 * Redirects to login page preserving the current path for redirectAfterLogin.
 */
export function redirectToLogin(redirectTo?: string): void {
	const params = new URLSearchParams()
	if (redirectTo) params.set('redirectTo', redirectTo)
	navigateTo(`/login?${params.toString()}`)
}