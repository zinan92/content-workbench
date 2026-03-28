export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Welcome to Content Workbench
        </h2>
        <p className="text-gray-600 mb-4">
          This is a local-first tool for manual content replication from Douyin to multiple platforms.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            V1 Scope
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Link Intake (Douyin creator profiles and single videos)</li>
            <li>• Candidate Discovery and Review</li>
            <li>• Asset Preparation with Status Tracking</li>
            <li>• Single Video Studio for Manual Replication</li>
            <li>• Target Platforms: XiaoHongShu, Bilibili, WeChat, X</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
