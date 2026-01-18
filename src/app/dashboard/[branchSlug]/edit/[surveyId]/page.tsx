import EditSurveyView from '@/components/dashboard/EditSurveyView'

export default function BranchEditPage({ params }: { params: { branchSlug: string, surveyId: string } }) {
    return (
        <EditSurveyView
            surveyId={params.surveyId}
            backLink={`/dashboard/${params.branchSlug}`}
        />
    )
}
