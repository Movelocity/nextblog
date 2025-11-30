package api

import (
	"fmt"
	"net/http"
	"runtime"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
)

var serverStartTime time.Time

func init() {
	serverStartTime = time.Now()
}

/**
 * SystemHandler 系统状态处理器
 */
type SystemHandler struct{}

/**
 * NewSystemHandler 创建系统状态处理器实例
 */
func NewSystemHandler() *SystemHandler {
	return &SystemHandler{}
}

/**
 * GetSystemStatus 获取系统状态
 * GET /api/system/status
 */
func (h *SystemHandler) GetSystemStatus(c *gin.Context) {
	// 获取系统内存信息
	vmStat, err := mem.VirtualMemory()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get memory info"})
		return
	}
	
	// 获取进程内存信息
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)
	
	// 获取磁盘信息
	diskStat, err := disk.Usage("/")
	diskUsage := make(map[string]float64)
	if err == nil {
		diskUsage["/"] = diskStat.UsedPercent
	}
	
	// 计算运行时长
	uptime := time.Since(serverStartTime).Seconds()
	
	response := gin.H{
		"boot_time":           serverStartTime.Unix(),
		"boot_time_formatted": serverStartTime.Format("2006-01-02 15:04:05"),
		"uptime_seconds":      int64(uptime),
		"memory": gin.H{
			"system": gin.H{
				"total":          vmStat.Total,
				"used":           vmStat.Used,
				"free":           vmStat.Free,
				"usage_percent":  fmt.Sprintf("%.2f%%", vmStat.UsedPercent),
				"total_formatted": formatBytes(vmStat.Total),
				"used_formatted":  formatBytes(vmStat.Used),
				"free_formatted":  formatBytes(vmStat.Free),
			},
			"process": gin.H{
				"rss":                  memStats.Alloc,
				"heap_total":           memStats.HeapSys,
				"heap_used":            memStats.HeapAlloc,
				"rss_formatted":        formatBytes(memStats.Alloc),
				"heap_total_formatted": formatBytes(memStats.HeapSys),
				"heap_used_formatted":  formatBytes(memStats.HeapAlloc),
			},
		},
		"disk": diskUsage,
	}
	
	c.JSON(http.StatusOK, response)
}

/**
 * formatBytes 格式化字节为可读字符串
 * @param bytes 字节数
 * @return 格式化后的字符串（如 "1.23 MB"）
 */
func formatBytes(bytes uint64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	
	div, exp := uint64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	
	units := []string{"KB", "MB", "GB", "TB", "PB"}
	return fmt.Sprintf("%.2f %s", float64(bytes)/float64(div), units[exp])
}

