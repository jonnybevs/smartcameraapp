import Foundation
import TensorFlowLite

@objc(TFLiteModule)
class TFLiteModule: NSObject {
  
  private var interpreter: Interpreter?
  private let inputSize = 224
  private let pixelSize = 3
  private let numClasses = 2
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func loadModel(_ modelName: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    do {
      guard let modelPath = Bundle.main.path(forResource: modelName, ofType: "tflite") else {
        rejecter("MODEL_NOT_FOUND", "Model file not found in bundle: \(modelName).tflite", nil)
        return
      }
      
      var options = Interpreter.Options()
      options.threadCount = 4
      
      interpreter = try Interpreter(modelPath: modelPath, options: options)
      
      try interpreter?.allocateTensors()
      
      resolver(true)
    } catch {
      rejecter("MODEL_LOAD_ERROR", "Failed to load model: \(error.localizedDescription)", error)
    }
  }
  
  @objc
  func runInference(_ imageData: [NSNumber], resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard let interpreter = interpreter else {
      rejecter("MODEL_NOT_LOADED", "Model not loaded. Call loadModel first.", nil)
      return
    }
    
    do {
      var inputData = Data()
      
      for number in imageData {
        var float = number.floatValue
        let data = Data(bytes: &float, count: MemoryLayout<Float>.size)
        inputData.append(data)
      }
      
      try interpreter.copy(inputData, toInputAt: 0)
      
      try interpreter.invoke()
      
      let outputTensor = try interpreter.output(at: 0)
      
      let outputData = outputTensor.data
      let outputArray = outputData.withUnsafeBytes { (pointer: UnsafeRawBufferPointer) -> [Float] in
        let floatPointer = pointer.bindMemory(to: Float.self)
        return Array(floatPointer)
      }
      
      let result = outputArray.map { NSNumber(value: $0) }
      
      resolver(result)
    } catch {
      rejecter("INFERENCE_ERROR", "Inference failed: \(error.localizedDescription)", error)
    }
  }
}
