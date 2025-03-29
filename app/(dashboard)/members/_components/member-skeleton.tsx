import { 
    Card, 
    CardContent, 
    CardHeader 
  } from "@/components/ui/card";
  import { Skeleton } from "@/components/ui/skeleton";
  import { Separator } from "@/components/ui/separator";
  
  export function MemberSkeleton() {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-[120px]" />
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[120px]" />
          </div>
        </div>
  
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Member profile card skeleton */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-4">
                  <Skeleton className="size-16 rounded-full" />
                  <div>
                    <Skeleton className="h-7 w-48 mb-2" />
                    <Skeleton className="h-4 w-36 mb-2" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-32" />
                    
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={`personal-${i}`} className="flex items-start space-x-3">
                          <Skeleton className="size-5 rounded-full mt-0.5" />
                          <div>
                            <Skeleton className="h-5 w-40 mb-1" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-32" />
                    
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={`address-${i}`} className="flex items-start space-x-3">
                          <Skeleton className="size-5 rounded-full mt-0.5" />
                          <div>
                            <Skeleton className="h-5 w-full mb-1" />
                            {i === 1 && (
                              <>
                                <Skeleton className="h-5 w-2/3 mb-1" />
                                <Skeleton className="h-5 w-5/6 mb-1" />
                              </>
                            )}
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Member attendance skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[250px] w-full" />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            {/* Membership details skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                  
                  <Skeleton className="h-px w-full" /> {/* Separator */}
                  
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={`membership-${i}`} className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    ))}
                  </div>
                  
                  <Skeleton className="h-9 w-full mt-4" /> {/* Button */}
                </div>
              </CardContent>
            </Card>
            
            {/* Recent activity skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={`activity-${i}`} className="flex items-start space-x-3">
                      <Skeleton className="size-6 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-28 mb-1" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                    </div>
                  ))}
                  <Skeleton className="h-8 w-full mt-2" /> {/* Button */}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }