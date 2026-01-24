import SurveyResponsesView from '@/components/dashboard/SurveyResponsesView'

export default function SurveyResponsesPage({ params }: { params: { surveyId: string } }) {
    return <SurveyResponsesView surveyId={params.surveyId} />
}
