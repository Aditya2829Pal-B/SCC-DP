/**
 * Standardized API Response Wrapper Class
 */
export class ApiResponse {
  /**
   * Send a successful JSON response
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  /**
   * Send a 201 Created JSON response
   */
  static created(res, data = null, message = 'Resource created successfully') {
    return res.status(201).json({
      success: true,
      message,
      data
    });
  }

  /**
   * Send a structured error JSON response
   */
  static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
    const responsePayload = {
      success: false,
      message
    };
    
    if (errors) {
      responsePayload.errors = errors;
    }
    
    return res.status(statusCode).json(responsePayload);
  }
}

export default ApiResponse;
