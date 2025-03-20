export const partDescriptions = {
    'GEO_Propeller_01': {
      title: 'Front Left Propeller',
      description: 'Generates lift and propulsion for the front left quadrant of the drone. Rotates counter-clockwise to balance the torque from other propellers.',
      specs: ['Diameter: 8 inches', 'Material: Carbon fiber composite', 'Max RPM: 15,000']
    },
    'GEO_Propeller_02': {
      title: 'Front Right Propeller',
      description: 'Generates lift and propulsion for the front right quadrant of the drone. Rotates clockwise to balance the torque from other propellers.',
      specs: ['Diameter: 8 inches', 'Material: Carbon fiber composite', 'Max RPM: 15,000']
    },
    'GEO_Propeller_03': {
      title: 'Rear Left Propeller',
      description: 'Generates lift and propulsion for the rear left quadrant of the drone. Rotates clockwise to balance the torque from other propellers.',
      specs: ['Diameter: 8 inches', 'Material: Carbon fiber composite', 'Max RPM: 15,000']
    },
    'GEO_Propeller_04': {
      title: 'Rear Right Propeller',
      description: 'Generates lift and propulsion for the rear right quadrant of the drone. Rotates counter-clockwise to balance the torque from other propellers.',
      specs: ['Diameter: 8 inches', 'Material: Carbon fiber composite', 'Max RPM: 15,000']
    },
    'GEO_Arm_01': {
      title: 'Drone Arm',
      description: 'Structural component that extends from the central body to support the motors and propellers. Designed for optimal weight distribution and stability during flight.',
      specs: ['Material: Carbon fiber', 'Length: 20cm', 'Weight: 45g']
    },
    'GEO_Battery': {
      title: 'Battery Pack',
      description: 'High-capacity lithium polymer battery that powers all drone systems. Positioned centrally for balanced weight distribution.',
      specs: ['Capacity: 5200mAh', 'Voltage: 11.1V (3S)', 'Max Discharge: 25C', 'Flight Time: ~25 minutes']
    },
    'GEO_Body': {
      title: 'Main Frame',
      description: 'Central chassis that houses the flight controller, battery, and connects all components. Designed for structural integrity while minimizing weight.',
      specs: ['Material: Carbon fiber composite', 'Weight: 120g', 'Dimensions: 30cm x 30cm']
    },
    'GEO_Camera': {
      title: 'Camera Module',
      description: 'High-definition camera system for aerial photography and videography. Features electronic stabilization for smooth footage.',
      specs: ['Resolution: 4K/60fps', '120° Field of View', '3-axis electronic stabilization', 'Low-light enhancement']
    },
    'GEO_Motor': {
      title: 'Brushless Motor',
      description: 'High-efficiency brushless DC motor that drives the propellers. Designed for maximum power output with minimal heat generation.',
      specs: ['Type: 2306 Brushless', 'KV Rating: 2450KV', 'Max Power: 220W', 'Max Thrust: 950g']
    },
    'entire_model': {
      title: 'Quadcopter Drone',
      description: 'A versatile unmanned aerial vehicle designed for photography, surveying, and recreational flight. Features a lightweight frame, high-efficiency motors, and advanced stabilization systems.',
      specs: ['Flight Time: ~25 minutes', 'Max Speed: 60 km/h', 'Range: 5 km', 'Weight: 1500g']
    },
    'default': {
      title: 'Unavailable Part',
      description: 'No information is available.',
      specs: ['Material: N/A', 'Weight: N/A', 'Dimensions: N/A']
    }
  };

  export const  getPartDescription = (partName) => {
    if (partName === 'entire_model') {
      return {
        title: 'Complete Drone Assembly',
        description: 'The full quadcopter assembly showing all operational components in their working configuration.',
        specs: ['Weight: 1.2kg', 'Max Flight Time: 30mins', 'Payload Capacity: 500g']
      };
    }
    if(!partDescriptions[partName]){
      return partDescriptions['default'];
    }
    return partDescriptions[partName];
  };
  