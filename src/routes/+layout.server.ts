import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { userPreferences } from '$lib/server/db/schema';

export const load: LayoutServerLoad = async (event) => {
	const user = event.locals.user;
	const path = event.url.pathname;

	if (user && path !== '/onboarding' && path !== '/login' && !path.startsWith('/auth/')) {
		const [prefs] = await db
			.select({ onboardingCompletedAt: userPreferences.onboardingCompletedAt })
			.from(userPreferences)
			.where(eq(userPreferences.userId, user.id));

		if (!prefs?.onboardingCompletedAt) {
			return redirect(302, '/onboarding');
		}
	}

	return { user };
};
