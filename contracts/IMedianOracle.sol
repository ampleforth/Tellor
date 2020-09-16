
pragma solidity 0.6.0;

interface IMedianOracle{

     // The number of seconds after which the report is deemed expired.
    uint256 public reportExpirationTimeSec;

    // The number of seconds since reporting that has to pass before a report
    // is usable.
    uint256 public reportDelaySec;


    function pushReport(uint256 payload) external;
    function purgeReports() external;
}