import SurveyResponsesView from '@/components/dashboard/SurveyResponsesView'

export default function BranchSurveyResponsesPage({ params }: { params: { branchSlug: string, surveyId: string } }) {
    return (
        <SurveyResponsesView
            surveyId={params.surveyId}
            backLink={`/dashboard/${params.branchSlug}`}
        />
    )
}
