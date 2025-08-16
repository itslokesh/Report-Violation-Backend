const base = 'http://localhost:3000';

async function request(method, path, body, token) {
	const res = await fetch(base + path, {
		method,
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {})
		},
		body: body ? JSON.stringify(body) : undefined
	});
	const text = await res.text();
	try {
		return { status: res.status, data: JSON.parse(text) };
	} catch {
		return { status: res.status, data: text };
	}
}

(async () => {
	try {
		console.log('Health...');
		let r = await request('GET', '/health');
		console.log('  /health', r.status, r.data && r.data.success);

		console.log('Police login...');
		r = await request('POST', '/api/auth/police/login', { email: 'officer1@police.gov.in', password: 'password123' });
		if (r.status !== 200 || !r.data?.data?.accessToken) {
			console.error('  login failed', r.status, r.data);
			process.exit(1);
		}
		const token = r.data.data.accessToken;
		console.log('  login ok');

		console.log('Dashboard...');
		r = await request('GET', '/api/police/dashboard', undefined, token);
		console.log('  /api/police/dashboard', r.status, r.data?.success ?? false);

		console.log('List reports...');
		r = await request('GET', '/api/police/reports?page=1&limit=3', undefined, token);
		console.log('  /api/police/reports', r.status, r.data?.success ?? false);
		let firstReportId;
		try { firstReportId = r.data?.data?.reports?.[0]?.id; } catch {}

		if (firstReportId) {
			console.log('Get report by id...');
			const r2 = await request('GET', `/api/police/reports/${firstReportId}`, undefined, token);
			console.log('  /api/police/reports/:id', r2.status, r2.data?.success ?? false);
		}

		console.log('Feedback stats...');
		r = await request('GET', '/api/feedback/stats', undefined, token);
		console.log('  /api/feedback/stats', r.status, r.data?.success ?? false);

		console.log('OK');
		process.exit(0);
	} catch (e) {
		console.error('Smoke test failed:', e);
		process.exit(1);
	}
})();
