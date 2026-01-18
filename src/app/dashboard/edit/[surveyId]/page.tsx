import EditSurveyView from '@/components/dashboard/EditSurveyView'

export default function EditSurveyPage({ params }: { params: { surveyId: string } }) {
    return <EditSurveyView surveyId={params.surveyId} />
}
