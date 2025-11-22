import { NextApiRequest, NextApiResponse } from 'next';

// Mock function to simulate lesson data generation
const generateLessonData = (gradeBand: string, subjects: string[], standards: string[], rwfTheme: string) => {
    return {
        unity_manifest: {
            version: "1.0",
            scene: "LessonScene",
            assets: []
        },
        lesson_id: `lesson-${Math.random().toString(36).substring(2, 15)}`
    };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { grade_band, subjects, standards, rwf_theme } = req.body;

        if (!grade_band || !subjects || !standards || !rwf_theme) {
            return res.status(400).json({ error: 'Missing parameters.' });
        }

        const lessonData = generateLessonData(grade_band, subjects, standards, rwf_theme);
        res.status(200).json(lessonData);
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}