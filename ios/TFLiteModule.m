#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(TFLiteModule, NSObject)

RCT_EXTERN_METHOD(loadModel:(NSString *)modelName
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(runInference:(NSArray<NSNumber *> *)imageData
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
