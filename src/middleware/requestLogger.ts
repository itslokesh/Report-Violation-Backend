import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
	const start = Date.now();
	const { method, originalUrl } = req;
	const userId = (req as any).user?.id;

	res.on('finish', () => {
		const durationMs = Date.now() - start;
		const status = res.statusCode;
		const contentLength = res.getHeader('content-length') || 0;
		console.log(
			JSON.stringify({
				timestamp: new Date().toISOString(),
				method,
				url: originalUrl,
				status,
				durationMs,
				contentLength,
				userId: userId || null
			})
		);
	});

	next();
};


